import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { systemPrompt, firstMessage, sessionId } = body



        console.log("Received /api/vapi/start request - Session ID:", sessionId)

        // Debug: Fetch session directly here to see what the DB has
        if (sessionId) {
            const sessionCheck = await prisma.interviewSession.findUnique({
                where: { id: sessionId },
                select: { id: true, jdRaw: true, pack: { select: { title: true } } }
            })
            console.log("  - DB Session Check:", JSON.stringify(sessionCheck, null, 2))
        }

        // Using VAPI private key
        console.log("Server URL:", process.env.NEXT_PUBLIC_SERVER_URL)

        if (!process.env.NEXT_PUBLIC_SERVER_URL) {
            console.error("❌ NEXT_PUBLIC_SERVER_URL is missing!")
            return NextResponse.json({
                error: "Server Configuration Error: Missing NEXT_PUBLIC_SERVER_URL"
            }, { status: 500 })
        }

        // Create an ephemeral assistant via Vapi API
        const assistantConfig = {
            // Config for "Alex"
            model: {
                provider: "custom-llm",
                url: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/vapi/chat`,
                model: "custom-model-v1",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    }
                ]
            },
            voice: {
                provider: "11labs",
                voiceId: "burt" // Default male voice
            },
            firstMessage: firstMessage,
            transcriber: {
                provider: "deepgram",
                model: "nova-2",
                language: "en"
            },
            maxDurationSeconds: 3600, // 1 hour - allow full interview duration
            metadata: {
                sessionId: sessionId
            },
            name: `Alex-Session-${sessionId ? sessionId.substring(0, 6) : 'Demo'}`
        }

        // Assistant created successfully

        const vapiRes = await fetch('https://api.vapi.ai/assistant', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assistantConfig)
        })

        if (!vapiRes.ok) {
            const errorText = await vapiRes.text()
            console.error("Vapi API Error Status:", vapiRes.status)
            console.error("Vapi API Error Body:", errorText)

            try {
                const errorJson = JSON.parse(errorText)
                return NextResponse.json(errorJson, { status: vapiRes.status })
            } catch {
                return NextResponse.json({ error: errorText }, { status: vapiRes.status })
            }
        }

        const assistant = await vapiRes.json()
        console.log("Created Assistant ID:", assistant.id)
        return NextResponse.json(assistant)

    } catch (error) {
        console.error("Failed to create assistant - Internal Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
