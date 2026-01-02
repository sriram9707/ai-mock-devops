import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import prisma from '@/lib/prisma'
import { generateSystemPrompt } from '@/lib/ai/prompts'
import { getPreviousQuestions } from '@/lib/question-tracking'
import { ParsedJD } from '@/lib/jd-parser'
import { analyzeInterviewState, type InterviewState } from '@/lib/ai/llm-state-manager'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

/**
 * OpenAI Chat Completions Compatible Endpoint
 * For ElevenLabs Custom LLM configuration
 * 
 * Path: /chat/completions (matches ElevenLabs config)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        
        // OpenAI Chat Completions format
        const { model, messages, stream, temperature, max_tokens } = body
        
        // Extract sessionId from various possible locations
        const sessionId = req.headers.get('x-session-id') || 
                         req.headers.get('x-sessionid') ||
                         body.sessionId || 
                         body.metadata?.sessionId ||
                         body.metadata?.session_id ||
                         (messages && messages.find((m: any) => m.sessionId)?.sessionId)

        if (!sessionId) {
            console.warn('⚠️ No sessionId found in request. Attempting to continue without session context.')
            // Continue without session context for testing
        }

        let systemPrompt = "You are Alex, a helpful technical interviewer."
        let conversationHistory = messages || []
        
        // If we have sessionId, fetch full context
        if (sessionId) {
            const session = await prisma.interviewSession.findUnique({
                where: { id: sessionId },
                include: {
                    user: { include: { profile: true } },
                    pack: true,
                    turns: {
                        orderBy: { createdAt: 'asc' },
                        take: 20
                    }
                }
            })

            if (session && session.user.profile && session.pack) {
                // Get or generate system prompt
                systemPrompt = (session as any).systemPrompt
                if (!systemPrompt) {
                    const previousQuestions = await getPreviousQuestions(session.userId, session.packId, sessionId)
                    let parsedJD: ParsedJD | null = null
                    if (session.jdParsed) {
                        try {
                            parsedJD = JSON.parse(session.jdParsed) as ParsedJD
                        } catch (error) {
                            console.error('Failed to parse stored JD:', error)
                        }
                    }

                    systemPrompt = generateSystemPrompt({
                        userSkills: session.user.profile.skills,
                        targetRole: session.pack.level,
                        jdText: session.jdRaw || session.pack.description,
                        interviewTypeTitle: session.pack.title,
                        parsedJD: parsedJD,
                        previousQuestions: previousQuestions,
                        packRole: session.pack.role,
                        retrievedContext: '',
                        isPractice: session.isPractice
                    })

                    await prisma.interviewSession.update({
                        where: { id: sessionId },
                        data: { systemPrompt } as any
                    })
                }

                // Extract user message
                const userMessage = messages.find((m: any) => m.role === 'user')
                const userMessageText = userMessage?.content || ''

                // Save user turn
                if (userMessageText && !session.turns.some(t => t.message === userMessageText && t.role === 'candidate')) {
                    await prisma.interviewTurn.create({
                        data: {
                            sessionId,
                            role: 'candidate',
                            message: userMessageText
                        }
                    })
                }

                // Build conversation history
                conversationHistory = messages.filter((m: any) => m.role !== 'system')

                // Pre-turn analysis
                let interviewState: InterviewState | null = null
                try {
                    const previousState = (session as any).interviewState 
                        ? JSON.parse((session as any).interviewState) 
                        : undefined

                    interviewState = await analyzeInterviewState(conversationHistory, {
                        packLevel: session.pack.level,
                        packRole: session.pack.role,
                        jdText: session.jdRaw || undefined,
                        previousState
                    })

                    await prisma.interviewSession.update({
                        where: { id: sessionId },
                        data: { interviewState: JSON.stringify(interviewState) } as any
                    })
                } catch (error) {
                    console.error('Failed to analyze interview state:', error)
                }

                // RAG retrieval
                let retrieved = ''
                try {
                    const { retrieveContext } = await import('@/lib/retrieval-service')
                    const ragQuery = interviewState?.nextAction?.ragQuery || userMessageText || ''
                    if (ragQuery) {
                        console.log(`🔍 RAG: Retrieving context for query: "${ragQuery.substring(0, 50)}..."`)
                        retrieved = await retrieveContext(ragQuery, session.pack.level)
                        if (retrieved) console.log('✅ RAG: Context retrieved')
                    }
                } catch (err) {
                    console.error('❌ RAG Retrieval Failed:', err)
                }

                // Enhance system prompt with state and RAG
                if (interviewState) {
                    systemPrompt += `\n\n## Current Interview State:
- Phase: ${interviewState.phase}
- Current Topic: ${interviewState.currentTopic || 'Not set'}
- Question Depth: ${interviewState.questionDepth}
- Next Action: ${interviewState.nextAction.action}
- Question Type: ${interviewState.nextAction.questionType}`
                }
                if (retrieved) {
                    systemPrompt += `\n\n## Additional Context from Knowledge Base:\n${retrieved}`
                }
            }
        }

        // Build messages array with enhanced system prompt
        const conversation = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10) // Last 10 turns
        ]

        // Generate AI response using OpenAI
        const response = await openai.chat.completions.create({
            model: model || 'gpt-4o',
            messages: conversation as any,
            temperature: temperature || 0.7,
            max_tokens: max_tokens || 250,
            stream: stream || false
        })

        // Save interviewer turn if we have sessionId
        const aiResponse = response.choices[0]?.message?.content || "I'm sorry, I didn't get that. Could you repeat?"
        
        if (sessionId) {
            try {
                const userMessage = messages.find((m: any) => m.role === 'user')
                if (userMessage?.content) {
                    await prisma.interviewTurn.create({
                        data: {
                            sessionId,
                            role: 'interviewer',
                            message: aiResponse,
                            isQuestion: aiResponse.includes('?')
                        }
                    })
                }
            } catch (error) {
                console.error('Failed to save interviewer turn:', error)
            }
        }

        // Return OpenAI-compatible response format
        return NextResponse.json({
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model || 'gpt-4o',
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: aiResponse
                    },
                    finish_reason: 'stop'
                }
            ],
            usage: {
                prompt_tokens: response.usage?.prompt_tokens || 0,
                completion_tokens: response.usage?.completion_tokens || 0,
                total_tokens: response.usage?.total_tokens || 0
            }
        })

    } catch (error: any) {
        console.error('Error in chat completions:', error)
        return NextResponse.json(
            { 
                error: {
                    message: error.message || 'Internal server error',
                    type: 'server_error'
                }
            },
            { status: 500 }
        )
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: Request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id, X-SessionID',
        }
    })
}

