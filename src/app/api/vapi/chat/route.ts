import { NextResponse } from 'next/server'
// import { OpenAIStream, StreamingTextResponse } from 'ai' 
// Removed 'ai' SDK usage to use pure OpenAI streaming for better V0/V5 compatibility

import OpenAI from 'openai'
import prisma from '@/lib/prisma'
import { generateSystemPrompt } from '@/lib/ai/prompts'
import { getPreviousQuestions, saveQuestionTurn } from '@/lib/question-tracking'
import { isQuestion } from '@/lib/question-utils'
import { ParsedJD } from '@/lib/jd-parser'

// Instantiate OpenAI 
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

// export const runtime = 'edge' // Removed to allow Prisma Client + SQLite usage


export async function POST(req: Request) {
    try {
        const body = await req.json()

        // Vapi sends different message types
        // 1. 'assistant-request': Initial handshake. We must return the assistant config.
        // 2. 'conversation-update' (or plain structure): The actual chat turn.

        const { message, call } = body
        const messageType = message?.type || body.type // Normalized type check

        // Log minimal info (no message content)
        console.log("Received /api/vapi/chat event - Type:", messageType)

        // Validate server URL is set
        if (!process.env.NEXT_PUBLIC_SERVER_URL) {
            console.error("❌ NEXT_PUBLIC_SERVER_URL is not set!")
            return NextResponse.json({
                error: 'Server configuration error: NEXT_PUBLIC_SERVER_URL not set'
            }, { status: 500 })
        }

        // --- HANDSHAKE HANDLER ---
        if (messageType === 'assistant-request') {
            const sessionId = call?.metadata?.sessionId
            let systemPrompt = "You are Alex, a helpful SRE interviewer."
            let dynamicFirstMessage = "Hi, I'm Alex. I'll be conducting your technical interview today. To get started, could you give me a brief overview of your background? I'd like to hear about your years of experience, your current role, and the key technologies and tools you've worked with."

            // Re-fetch context even for handshake (optional, but good for consistency)
            if (sessionId) {
                const session = await prisma.interviewSession.findUnique({
                    where: { id: sessionId },
                    include: {
                        user: { include: { profile: true } },
                        pack: true
                    }
                })
                if (session && session.user.profile && session.pack) {
                    // Generate dynamic first message based on pack level
                    const levelLower = session.pack.level.toLowerCase()
                    let introLine = "I'm a Cloud Architect here,"

                    if (levelLower.includes('entry') || levelLower.includes('junior')) {
                        introLine = "I'm a Senior Engineer here,"
                    } else if (levelLower.includes('architect')) {
                        introLine = "I'm a Lead Architect here,"
                    }

                    dynamicFirstMessage = `Hi, I'm Alex. ${introLine} and I'll be conducting your technical interview today. We'll cover various topics over the next hour, and I'm looking forward to learning about your experience. To get started, could you give me a brief overview of your background? I'd like to hear about your years of experience, your current role, and the key technologies and tools you've worked with.`

                    // Get previous questions for this user/pack (exclude current session)
                    const previousQuestions = await getPreviousQuestions(session.userId, session.packId, sessionId)

                    // Parse JD if available
                    let parsedJD: ParsedJD | null = null
                    if (session.jdParsed) {
                        try {
                            parsedJD = JSON.parse(session.jdParsed) as ParsedJD
                        } catch (error) {
                            console.error('Failed to parse stored JD:', error)
                        }
                    }

                    // Build candidate profile for JD gap analysis
                    let candidateProfile: { skills: string[], experienceYears?: number, level?: string, technologies?: string[] } | undefined
                    if (session.user.profile) {
                        try {
                            const skills = JSON.parse(session.user.profile.skills || '[]') as string[]
                            candidateProfile = {
                                skills: skills,
                                level: session.user.profile.level || undefined,
                                technologies: parsedJD?.tools || [] // Use JD tools as candidate tech if available
                            }
                        } catch (e) {
                            // Fallback
                            candidateProfile = {
                                skills: [],
                                level: session.user.profile.level || undefined
                            }
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
                        candidateProfile: candidateProfile
                    })
                }
            }

            // For custom-llm provider, return the model config directly (not nested under 'assistant')
            const assistantConfig = {
                model: {
                    provider: "custom-llm",
                    url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/vapi/chat`,
                    model: "custom-model-v1",
                    messages: [
                        { role: "system", content: systemPrompt }
                    ]
                },
                firstMessage: dynamicFirstMessage,
            }

            return NextResponse.json(assistantConfig, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            })
        }

        // --- CHAT TURN HANDLER ---
        // Vapi sends 'messages' array in the body for conversation updates
        const messages = body.messages || []

        if (messages.length === 0) {
            // Probably a status update (speech-start, etc.) that we can ignore for now
            return new Response(null, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                }
            })
        }

        const sessionId = call?.metadata?.sessionId || body.metadata?.sessionId

        let systemPrompt = "You are Alex, a helpful SRE interviewer." // Default fallback

        if (sessionId) {
            const session = await prisma.interviewSession.findUnique({
                where: { id: sessionId },
                include: {
                    user: { include: { profile: true } },
                    pack: true
                }
            })

            if (session && session.user.profile && session.pack) {
                // Get previous questions for this user/pack (exclude current session)
                const previousQuestions = await getPreviousQuestions(session.userId, session.packId, sessionId)

                // Parse JD if available
                let parsedJD: ParsedJD | null = null
                if (session.jdParsed) {
                    try {
                        parsedJD = JSON.parse(session.jdParsed) as ParsedJD
                    } catch (error) {
                        console.error('Failed to parse stored JD:', error)
                    }
                }


                // RAG: Retrieve context based on the last user message
                const lastUserMsg = messages[messages.length - 1]
                let retrieved = ''

                if (lastUserMsg && lastUserMsg.role !== 'system') {
                    // Only retrieve if it's a substantive user turn
                    try {
                        // Dynamically import to avoid edge runtime issues if any
                        const { retrieveContext } = await import('@/lib/retrieval-service')
                        console.log(`🔍 RAG: Retrieving context for query: "${lastUserMsg.content.substring(0, 50)}..."`)
                        retrieved = await retrieveContext(lastUserMsg.content, session.pack.level)
                        if (retrieved) console.log('✅ RAG: Context retrieved')
                    } catch (err) {
                        console.error('❌ RAG Retrieval Failed:', err)
                    }
                }

                // Generate Dynamic Prompt ("The Brain")
                systemPrompt = generateSystemPrompt({
                    userSkills: session.user.profile.skills,
                    targetRole: session.pack.level,
                    jdText: session.jdRaw || session.pack.description,
                    interviewTypeTitle: session.pack.title,
                    parsedJD: parsedJD,
                    previousQuestions: previousQuestions,
                    packRole: session.pack.role,
                    retrievedContext: retrieved
                })
            }
        }

        // Prepare messages for OpenAI
        const conversation = [
            { role: 'system', content: systemPrompt },
            ...messages.filter((m: any) => m.role !== 'system')
        ]

        // Call OpenAI with Standard Streaming
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: conversation as any,
            stream: true,
            temperature: 0.7,
            max_tokens: 250,
        })

        // Convert OpenAI Stream to a web ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder()
                let fullText = ""

                try {
                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content || ""
                        if (content) {
                            fullText += content
                        }
                        // Vapi requires the full OpenAI chunk format wrapped in SSE 'data: ...'
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                    }
                    // Signal stream end as per standard
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                } catch (err) {
                    console.error("Stream Error:", err)
                    controller.error(err)
                } finally {
                    controller.close()

                    // Log the full turn to DB after stream closes
                    if (sessionId && fullText) {
                        const lastUserMessage = messages[messages.length - 1]?.content || "(Audio)"
                        try {
                            // Log user turn
                            await prisma.interviewTurn.create({
                                data: { sessionId, role: 'candidate', message: lastUserMessage }
                            })

                            // Log interviewer turn with question tracking
                            if (isQuestion(fullText)) {
                                await saveQuestionTurn(sessionId, fullText)
                            } else {
                                await prisma.interviewTurn.create({
                                    data: {
                                        sessionId,
                                        role: 'interviewer',
                                        message: fullText,
                                        isQuestion: false
                                    }
                                })
                            }
                        } catch (dbErr) {
                            console.error("Failed to log turns:", dbErr)
                        }
                    }
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        })

    } catch (e: any) {
        console.error("❌ Vapi Chat Error:", e)
        console.error("Error stack:", e?.stack)
        return NextResponse.json({
            error: 'Internal Server Error',
            message: e?.message || 'Unknown error',
            details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
        }, {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            }
        })
    }
}

// Handle GET requests (Vapi health check / handshake)
export async function GET(req: Request) {
    // Health check endpoint

    return NextResponse.json({
        status: 'ok',
        message: 'Vapi custom-llm endpoint is ready',
        endpoint: '/api/vapi/chat'
    }, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    })
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    })
}
