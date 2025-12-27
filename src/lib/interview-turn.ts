
import prisma from '@/lib/prisma'
import { mockSTT, mockLLM, mockTTS } from './ai/stubs'
import { generateSystemPrompt } from './ai/prompts'
import { ParsedJD } from './jd-parser'

export async function processTurn(sessionId: string, audioBlob: Blob | Buffer) {
    // 1. STT: User Audio -> Text
    const userText = await mockSTT(audioBlob)

    // 2. Save User Turn
    await prisma.interviewTurn.create({
        data: {
            sessionId,
            role: 'candidate',
            message: userText,
            audioUrl: null // In real app, upload blob to S3 and save URL
        }
    })

    // 3. Fetch History & Context for Prompt
    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
            user: { include: { profile: true } },
            pack: true
        }
    })

    if (!session || !session.user.profile || !session.pack) {
        throw new Error('Session context missing for AI generation')
    }

    const turns = await prisma.interviewTurn.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: 20 // Increase context window
    })

    const history = turns.map(t => ({
        role: t.role === 'interviewer' ? 'assistant' : 'user',
        content: t.message
    }))

    // 4. Parse JD if available
    let parsedJD: ParsedJD | null = null
    if (session.jdParsed) {
        try {
            parsedJD = JSON.parse(session.jdParsed) as ParsedJD
        } catch (error) {
            console.error('Failed to parse stored JD:', error)
        }
    }

    // 5. LLM: Get Interviewer Response with "Alex" Persona
    const systemContext = generateSystemPrompt({
        userSkills: session.user.profile.skills,
        targetRole: session.pack.level,
        jdText: session.jdRaw || session.pack.description, // Fallback to pack description if no JD
        interviewTypeTitle: session.pack.title,
        parsedJD: parsedJD
    })

    const aiText = await mockLLM(history, systemContext)

    // 6. TTS: Generate Audio
    const aiAudioUrl = await mockTTS(aiText)

    // 7. Save AI Turn
    const aiTurn = await prisma.interviewTurn.create({
        data: {
            sessionId,
            role: 'interviewer',
            message: aiText,
            audioUrl: aiAudioUrl
        }
    })

    return {
        userText,
        aiText,
        aiAudio: aiAudioUrl,
        turnId: aiTurn.id
    }
}
