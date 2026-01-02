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
 * ElevenLabs Chat Endpoint
 * Handles conversation turns for ElevenLabs voice agent
 * This endpoint is called by ElevenLabs agent to get AI responses
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { message, sessionId, conversationId } = body

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            )
        }

        // Fetch session context
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

        if (!session || !session.user.profile || !session.pack) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        // Save user turn
        await prisma.interviewTurn.create({
            data: {
                sessionId,
                role: 'candidate',
                message: message || ''
            }
        })

        // Get or generate system prompt
        let systemPrompt = (session as any).systemPrompt
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

            // Cache system prompt
            await prisma.interviewSession.update({
                where: { id: sessionId },
                data: { systemPrompt } as any
            })
        }

        // Pre-turn analysis
        const conversationHistory = session.turns.map(turn => ({
            role: turn.role === 'interviewer' ? 'assistant' : 'user',
            content: turn.message
        }))
        if (message) {
            conversationHistory.push({ role: 'user', content: message })
        }

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
            const ragQuery = interviewState?.nextAction?.ragQuery || message || ''
            if (ragQuery) {
                retrieved = await retrieveContext(ragQuery, session.pack.level)
            }
        } catch (err) {
            console.error('RAG retrieval failed:', err)
        }

        // Enhance system prompt with state and RAG
        let enhancedSystemPrompt = systemPrompt
        if (interviewState) {
            enhancedSystemPrompt += `\n\n## Current Interview State:
- Phase: ${interviewState.phase}
- Current Topic: ${interviewState.currentTopic || 'Not set'}
- Question Depth: ${interviewState.questionDepth}
- Next Action: ${interviewState.nextAction.action}
- Question Type: ${interviewState.nextAction.questionType}`
        }
        if (retrieved) {
            enhancedSystemPrompt += `\n\n## Additional Context from Knowledge Base:\n${retrieved}`
        }

        // Generate AI response
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: enhancedSystemPrompt },
                ...conversationHistory.slice(-10) // Last 10 turns
            ],
            temperature: 0.7,
            max_tokens: 250
        })

        const aiResponse = response.choices[0]?.message?.content || "I'm sorry, I didn't get that. Could you repeat?"

        // Save interviewer turn
        await prisma.interviewTurn.create({
            data: {
                sessionId,
                role: 'interviewer',
                message: aiResponse,
                isQuestion: aiResponse.includes('?')
            }
        })

        return NextResponse.json({ 
            response: aiResponse,
            conversationId: conversationId || null
        })

    } catch (error: any) {
        console.error('Error in ElevenLabs chat:', error)
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        )
    }
}

