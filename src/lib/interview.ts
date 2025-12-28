'use server'

import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

export async function purchaseInterview(packId: string) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    // Find the pack to ensure it exists and get price
    const pack = await prisma.interviewPack.findUnique({
        where: { id: packId }
    })

    if (!pack) throw new Error('Pack not found')

    // Create Order (mock payment)
    const order = await prisma.order.create({
        data: {
            userId: user.id,
            packId: pack.id,
            amount: pack.price,
            status: 'PURCHASED'
        }
    })

    // Create Session
    const session = await prisma.interviewSession.create({
        data: {
            userId: user.id,
            packId: pack.id,
            status: 'PENDING',
        },
    })

    logger.userAction(user.id, 'purchase_interview', { packId: pack.id, packTitle: pack.title, amount: pack.price })
    redirect(`/interview/${session.id}/start`)
}

export async function startNewAttempt(packId: string) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    // Find active order with attempts remaining
    const order = await prisma.order.findFirst({
        where: {
            userId: user.id,
            packId: packId,
            status: 'PURCHASED',
            attemptsUsed: { lt: 2 } // 2 attempts per pack
        }
    })

    if (!order) {
        // No active order or all attempts used - redirect to purchase
        await purchaseInterview(packId)
        return
    }

    // Create New Session
    const session = await prisma.interviewSession.create({
        data: {
            userId: user.id,
            packId: packId,
            status: 'PENDING',
        },
    })

    redirect(`/interview/${session.id}/start`)
}
