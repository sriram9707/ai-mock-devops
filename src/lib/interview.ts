'use server'

import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

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


    redirect(`/interview/${session.id}/start`)
}

export async function startNewAttempt(packId: string) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    // Find active order
    const order = await prisma.order.findFirst({
        where: {
            userId: user.id,
            packId: packId,
            status: 'PURCHASED',
            attemptsUsed: { lt: 3 } // Hardcoded limit for now, ideally fetch from DB default
        }
    })

    if (!order) {
        // If no active order, check if they can purchase (or redirect to purchase)
        // For now, if no order, we throw error or redirect
        throw new Error('No active credits for this interview pack')
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
