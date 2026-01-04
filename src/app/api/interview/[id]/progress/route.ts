import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getInterviewProgress } from '@/lib/interview-progress'
import prisma from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify user owns this session
        const session = await prisma.interviewSession.findUnique({
            where: { id: id },
            select: { userId: true }
        })

        if (!session || session.userId !== userId) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        const progress = await getInterviewProgress(id)

        return NextResponse.json(progress)
    } catch (error: any) {
        console.error('Error fetching interview progress:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch progress' },
            { status: 500 }
        )
    }
}

