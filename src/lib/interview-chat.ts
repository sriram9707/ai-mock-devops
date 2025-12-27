'use server'

import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function submitAnswer(sessionId: string, message: string) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    // Save user message (optional for MVP, but good for history)
    // await prisma.message.create(...)

    // Mock AI response logic
    // In a real app, we'd call OpenAI/Gemini here with the conversation history and context (JD, Skills)

    const mockResponses = [
        "That's a great point. Can you elaborate on how you would handle scalability in that scenario?",
        "Interesting approach. What are the trade-offs of using that design pattern?",
        "Could you walk me through the algorithm you would use to solve this problem?",
        "How would you ensure the security of this system?",
        "Tell me about a time you faced a similar challenge and how you overcame it.",
    ]

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
        role: 'assistant',
        content: randomResponse
    }
}

export async function endInterview(sessionId: string) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
            status: 'COMPLETED',
            endedAt: new Date(),
        }
    })

    // Note: Actual result generation happens in finishInterview() function
    // This just marks the session as completed
}
