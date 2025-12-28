'use server'

import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { parseJobDescription } from '@/lib/jd-parser'
import { logger } from '@/lib/logger'

export async function startInterview(sessionId: string, formData: FormData) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    const jd = formData.get('jd') as string
    const isPractice = formData.get('isPractice') === 'true'

    // Enhanced JD parsing with LLM
    let jdParsed = null
    if (jd && jd.trim().length > 0) {
        console.log('📋 JD provided, starting parsing...')
        console.log('JD length:', jd.length, 'characters')
        try {
            const parsed = await parseJobDescription(jd)
            console.log('✅ JD parsed successfully:', {
                role: parsed.role,
                level: parsed.level,
                tools: parsed.tools.length,
                technicalRequirements: parsed.technicalRequirements?.length || 0
            })
            jdParsed = JSON.stringify(parsed)
        } catch (error) {
            console.error('❌ Failed to parse JD:', error)
            // Fallback to basic structure
            jdParsed = JSON.stringify({
                role: 'Software Engineer',
                level: 'Mid',
                keywords: []
            })
        }
    } else {
        console.log('ℹ️ No JD provided, skipping parsing')
    }

    // Fetch session to get packId for logging and order lookup
    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        select: { packId: true }
    })

    await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            jdRaw: jd || null,
            jdParsed: jdParsed,
            isPractice: isPractice
        }
    })

    // Log interview start
    if (session) {
        logger.interviewStart(sessionId, user.id, session.packId, isPractice)
    }

    // If not practice mode, increment attempts used on the order
    if (!isPractice && session) {

        // Find the oldest valid order (FIFO)
        const order = await prisma.order.findFirst({
            where: {
                userId: user.id,
                packId: session.packId,
                status: 'PURCHASED',
                attemptsUsed: { lt: 2 } // 2 attempts per pack
            },
            orderBy: { createdAt: 'asc' }
        })

        if (order) {
            await prisma.order.update({
                where: { id: order.id },
                data: { attemptsUsed: { increment: 1 } }
            })
        }
    }

    redirect(`/interview/${sessionId}/room`)
}
