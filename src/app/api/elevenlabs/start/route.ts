import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSystemPrompt } from '@/lib/ai/prompts'
import { getPreviousQuestions } from '@/lib/question-tracking'
import { ParsedJD } from '@/lib/jd-parser'

/**
 * ElevenLabs Start Endpoint
 * Initializes the interview session and returns configuration
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { sessionId, agentId } = body

        if (!sessionId) {
            return NextResponse.json(
                { error: 'sessionId is required' },
                { status: 400 }
            )
        }

        const elevenLabsAgentId = agentId || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_9401kdrmfv9hf13vwhkrba7gdaa6'

        console.log("Received /api/elevenlabs/start request - Session ID:", sessionId)

        // Fetch session
        const session = await prisma.interviewSession.findUnique({
            where: { id: sessionId },
            include: {
                user: { include: { profile: true } },
                pack: true
            }
        })

        if (!session || !session.user.profile || !session.pack) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            )
        }

        // Generate system prompt
        const previousQuestions = await getPreviousQuestions(session.userId, session.packId, sessionId)
        let parsedJD: ParsedJD | null = null
        if (session.jdParsed) {
            try {
                parsedJD = JSON.parse(session.jdParsed) as ParsedJD
            } catch (error) {
                console.error('Failed to parse stored JD:', error)
            }
        }

        const systemPrompt = generateSystemPrompt({
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

        // Return configuration for ElevenLabs agent
        // The agent will call /api/elevenlabs/chat for each turn
        return NextResponse.json({
            agentId: elevenLabsAgentId,
            sessionId: sessionId,
            webhookUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/elevenlabs/chat`,
            systemPrompt: systemPrompt.substring(0, 500) + '...' // Preview only
        })

    } catch (error: any) {
        console.error('Error in ElevenLabs start:', error)
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        )
    }
}

