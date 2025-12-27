import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getInterviewProgress } from '@/lib/interview-progress'
import prisma from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getSession()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user owns this session
        const session = await prisma.interviewSession.findUnique({
            where: { id: id },
            select: { userId: true }
        })

        if (!session || session.userId !== user.id) {
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

