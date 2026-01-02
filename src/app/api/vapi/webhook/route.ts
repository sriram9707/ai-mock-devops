import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Vapi sends webhook events for call lifecycle
// Docs: https://docs.vapi.ai/webhooks
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { message, call } = body

        console.log('📞 Vapi Webhook Event:', message?.type || 'unknown')

        // Handle end-of-call-report
        if (message?.type === 'end-of-call-report') {
            const sessionId = call?.metadata?.sessionId

            if (!sessionId) {
                console.warn('⚠️ No sessionId in end-of-call-report')
                return NextResponse.json({ received: true })
            }

            console.log(`✅ Call ended for session ${sessionId}`)

            // 1. Fetch full transcript/analysis from Vapi or use webhook data
            // Vapi sends transcript in artifact.messages or we can fetch it
            let conversationHistory: { role: string, content: string }[] = []

            if (message.artifact?.messages) {
                conversationHistory = message.artifact.messages
                    .filter((m: any) => m.role !== 'system') // Filter out system messages
                    .map((m: any) => ({
                        role: m.role,
                        content: m.message || m.content
                    }))
            } else if (message.transcript) {
                // Fallback if messages not structurally provided
                // This might need better parsing depending on Vapi format
                console.log('⚠️ Using raw transcript (less accurate)')
            }

            if (conversationHistory.length === 0) {
                console.warn('⚠️ No transcript found in webhook, skipping feedback generation')
                // Just mark completed so user isn't stuck provided they can re-run analysis
            }

            // --- ABANDONMENT CHECK ---
            // Get duration from call object (Vapi provides this)
            const duration = call?.duration || 0 // seconds
            // In Vapi artifact, user role is 'user', assistant is 'assistant'
            const candidateTurns = conversationHistory.filter(t => t.role === 'user').length

            // Allow shorter duration for dev/testing if needed, but keeping 5 mins for prod rule
            const isAbandoned = duration < (5 * 60) || candidateTurns < 2

            if (isAbandoned) {
                console.warn(`⚠️ Interview abandoned: ${Math.round(duration)}s, ${candidateTurns} turns. Refunding attempt.`)

                try {
                    const session = await prisma.interviewSession.findUnique({
                        where: { id: sessionId },
                        include: { user: true }
                    })

                    if (session) {
                        // Find the active order for this pack to refund
                        const order = await prisma.order.findFirst({
                            where: {
                                userId: session.userId,
                                packId: session.packId,
                                status: 'PURCHASED',
                                attemptsUsed: { gt: 0 }
                            },
                            orderBy: { createdAt: 'desc' }
                        })

                        if (order) {
                            await prisma.order.update({
                                where: { id: order.id },
                                data: { attemptsUsed: { decrement: 1 } }
                            })
                            console.log(`✅ Refunded attempt for abandoned interview via webhook.`)
                        }

                        await prisma.interviewSession.update({
                            where: { id: sessionId },
                            data: { status: 'ABANDONED', endedAt: new Date() }
                        })

                        logger.interviewEnd(sessionId, session.userId, session.packId, 'ABANDONED')
                    }
                } catch (err) {
                    console.error('❌ Failed to process abandonment refund:', err)
                }

                return NextResponse.json({ received: true })
            }

            // 2. Run Feedback Pipeline
            try {
                if (conversationHistory.length > 0) {
                    console.log('🚀 Triggering feedback generation from webhook...')
                    const { generateFeedbackPipeline } = await import('@/lib/ai/feedback-pipeline')
                    const pipelineResult = await generateFeedbackPipeline(conversationHistory)

                    // Transform pipeline result (reuse logic from interview-finish.ts)
                    // ... (Need to refactor transform logic to be shared, but for now duplicating essential parts)

                    // Simplified mapping for now to ensure result exists
                    const competencyScores = pipelineResult.topics.reduce((acc, t) => {
                        acc[t.topic] = t.overallScore
                        return acc
                    }, {} as Record<string, number>)

                    const resultData = {
                        overallScore: pipelineResult.overallScore,
                        competencyScores: JSON.stringify(competencyScores),
                        strengths: JSON.stringify(pipelineResult.topics.flatMap(t => t.keyStrengths)),
                        improvements: JSON.stringify(pipelineResult.topics.flatMap(t => t.keyWeaknesses)),
                        upskillingPlan: JSON.stringify({
                            weeks: pipelineResult.upskillingPlan.weeks,
                            focus_areas: pipelineResult.upskillingPlan.weeklyBreakdown.map(w => w.focus)
                        }),
                        feedback: `Evaluated ${pipelineResult.topics.length} topics. Overall score: ${pipelineResult.overallScore}/100.`
                    }

                    // 3. Save to DB
                    await prisma.interviewResult.create({
                        data: {
                            sessionId,
                            ...resultData
                        }
                    })
                    console.log('✅ Feedback generated and saved via webhook')
                }
            } catch (err) {
                console.error('❌ Webhook feedback generation failed:', err)
            }

            // 4. Update session status
            await prisma.interviewSession.update({
                where: { id: sessionId },
                data: {
                    status: 'COMPLETED',
                    endedAt: new Date()
                }
            })

            return NextResponse.json({ received: true })
        }

        // Handle other webhook types if needed
        if (message?.type === 'status-update') {
            // Optional: Track call status changes
            console.log('📊 Call status update:', message?.status)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('❌ Vapi Webhook Error:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    })
}
