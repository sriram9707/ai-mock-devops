
import { NextRequest, NextResponse } from 'next/server'
import { processTurn } from '@/lib/interview-turn'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
    const user = await getSession()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const sessionId = formData.get('sessionId') as string
        const audioFile = formData.get('audio') as File

        if (!sessionId || !audioFile) {
            return NextResponse.json({ error: 'Missing sessionId or audio' }, { status: 400 })
        }

        // Convert File to Buffer
        const arrayBuffer = await audioFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const result = await processTurn(sessionId, buffer)

        return NextResponse.json(result)
    } catch (error) {
        console.error('Turn processing error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
