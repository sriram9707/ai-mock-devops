'use server'

import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { scoreInterview } from '@/lib/ai/scoring'
import { logger } from '@/lib/logger'

export async function finishInterview(sessionId: string) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    // Get session to check if it's practice mode
    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { pack: true, turns: true }
    })

    if (!session) {
        throw new Error('Session not found')
    }

    // Calculate interview duration in minutes
    const startTime = session.startedAt || session.createdAt
    const endTime = new Date()
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 1000 / 60

    // Define minimum viable interview duration (5 minutes)
    const MINIMUM_DURATION_MINUTES = 5
    const userTurns = session.turns.filter(turn => turn.role === 'candidate' || turn.role === 'user')

    // Check if interview was abandoned too early
    const isAbandoned = durationMinutes < MINIMUM_DURATION_MINUTES || userTurns.length < 2

    // In practice mode, skip scoring and just mark as completed
    if (session.isPractice) {
        await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
                status: isAbandoned ? 'ABANDONED' : 'COMPLETED',
                endedAt: endTime
            }
        })
        logger.interviewEnd(sessionId, session.userId, session.packId, 'COMPLETED_PRACTICE')

        // Redirect to dashboard if abandoned, results if completed
        if (isAbandoned) {
            redirect('/dashboard?message=Interview was too short to evaluate. Please try again.')
        }
        redirect(`/interview/${sessionId}/results`)
        return
    }

    // Real interview: Handle abandoned interviews
    if (isAbandoned) {
        // Refund the attempt
        const order = await prisma.order.findFirst({
            where: {
                userId: user.id,
                packId: session.packId,
                status: 'PURCHASED',
                attemptsUsed: { gt: 0 }
            },
            orderBy: { createdAt: 'desc' } // Get the most recently created order
        })

        if (order) {
            await prisma.order.update({
                where: { id: order.id },
                data: { attemptsUsed: { decrement: 1 } }
            })
            console.log(`✅ Refunded attempt for abandoned interview. Order ${order.id} now has ${order.attemptsUsed - 1} attempts used.`)
        }

        // Mark session as abandoned
        await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
                status: 'ABANDONED',
                endedAt: endTime
            }
        })

        logger.interviewEnd(sessionId, session.userId, session.packId, 'ABANDONED')

        // Redirect to dashboard with message
        redirect(`/dashboard?message=Interview ended too early (${Math.round(durationMinutes)} min, ${userTurns.length} responses). Your attempt has been refunded. Please ensure your microphone is working before trying again.`)
        return
    }


    // Fetch previous completed session for comparison (if retake)
    const previousSession = await prisma.interviewSession.findFirst({
        where: {
            userId: session.userId,
            packId: session.packId,
            status: 'COMPLETED',
            id: { not: sessionId } // Exclude current session
        },
        orderBy: { endedAt: 'desc' },
        include: { result: true }
    })

    // Build conversation history for feedback generation
    const conversationHistory = session.turns.map(turn => ({
        role: turn.role === 'interviewer' ? 'assistant' : 'user',
        content: turn.message
    }))

    // ===== HYBRID FEEDBACK PIPELINE =====
    // Try new multi-step pipeline first, fallback to original if it fails
    let scoring: any
    let useNewPipeline = true // Feature flag - set to false to use old system

    if (useNewPipeline) {
        try {
            console.log('🚀 Using hybrid feedback pipeline...')
            const { generateFeedbackPipeline } = await import('@/lib/ai/feedback-pipeline')
            const pipelineResult = await generateFeedbackPipeline(conversationHistory)

            // Transform pipeline result to match original scoring format
            scoring = {
                // Map topic scores to technical competencies
                technicalCompetencies: pipelineResult.topics.reduce((acc, topic) => {
                    acc[topic.topic] = topic.overallScore
                    return acc
                }, {} as Record<string, number>),

                // Topic breakdown (NEW - more detailed)
                topicBreakdown: pipelineResult.topics.map(t => ({
                    topic: t.topic,
                    overallScore: t.overallScore,
                    subTopics: t.subTopicScores,
                    keyStrengths: t.keyStrengths,
                    keyWeaknesses: t.keyWeaknesses,
                    resources: [] // Will be populated by upskilling plan
                })),

                // Soft skills - use default for now (pipeline doesn't evaluate these yet)
                softSkills: {
                    behavioral: 7.0,
                    thinking: 7.0,
                    communication: 7.0,
                    problemSolving: 7.0
                },

                // Senior DevOps dimensions - default
                seniorDevOpsDimensions: {
                    architecturalReasoning: 7.0,
                    strategicTradeoffs: 7.0,
                    incidentManagement: 7.0,
                    operationalExcellence: 7.0
                },

                // Seniority gap - default
                seniorityGap: {
                    toolMastery: 'borderline',
                    automation: 'borderline',
                    impact: 'borderline',
                    communication: 'borderline'
                },

                overallScore: pipelineResult.overallScore,

                // Compile strengths and improvements from all topics
                strengths: pipelineResult.topics.flatMap(t => t.keyStrengths),
                improvements: pipelineResult.topics.flatMap(t => t.keyWeaknesses),

                // Generate feedback summary
                feedback: `Evaluated ${pipelineResult.topics.length} technical areas. ${pipelineResult.topics.filter(t => t.overallScore >= 7).length
                    } areas demonstrated strong performance, ${pipelineResult.topics.filter(t => t.overallScore < 7).length
                    } areas need improvement.`,

                // Use pipeline upskilling plan
                upskillingPlan: {
                    weeks: pipelineResult.upskillingPlan.weeks,
                    focus_areas: pipelineResult.upskillingPlan.weeklyBreakdown.map(week =>
                        `Week ${week.week}: ${week.focus} - ${week.tasks.join('; ')}`
                    )
                }
            }

            console.log('✅ Hybrid pipeline completed successfully')
        } catch (error) {
            console.error('❌ Hybrid pipeline failed, falling back to original scoring:', error)
            useNewPipeline = false
        }
    }

    // Fallback to original scoring system
    if (!useNewPipeline) {
        console.log('📊 Using original scoring system...')
        scoring = await scoreInterview(sessionId, previousSession?.result)
    }

    // Combine technical, senior DevOps dimensions, and soft skills for competency scores
    const competencyScores = {
        ...scoring.technicalCompetencies,
        // Senior DevOps Dimensions
        "Architectural Reasoning": scoring.seniorDevOpsDimensions?.architecturalReasoning || 0,
        "Strategic Trade-offs": scoring.seniorDevOpsDimensions?.strategicTradeoffs || 0,
        "Incident Management": scoring.seniorDevOpsDimensions?.incidentManagement || 0,
        "Operational Excellence": scoring.seniorDevOpsDimensions?.operationalExcellence || 0,
        // Soft Skills
        "Behavioral": scoring.softSkills.behavioral,
        "Thinking": scoring.softSkills.thinking,
        "Communication": scoring.softSkills.communication,
        "Problem Solving": scoring.softSkills.problemSolving
    }

    // Store seniority gap analysis separately for display
    const seniorityGapData = scoring.seniorityGap || {
        toolMastery: 'borderline' as const,
        automation: 'borderline' as const,
        impact: 'borderline' as const,
        communication: 'borderline' as const
    }

    // Store seniority gap analysis in competency scores JSON for easy access
    const competencyScoresWithGap = {
        ...competencyScores,
        _seniorityGap: seniorityGapData // Store separately for easy extraction
    }

    const result = {
        overallScore: scoring.overallScore,
        competencyScores: JSON.stringify(competencyScoresWithGap),
        strengths: JSON.stringify(scoring.strengths),
        improvements: JSON.stringify(scoring.improvements),
        upskillingPlan: JSON.stringify(scoring.upskillingPlan),
        feedback: scoring.feedback
    }

    // Session already fetched above, reuse it

    await prisma.$transaction(async (tx) => {
        // Create result
        await tx.interviewResult.create({
            data: {
                sessionId,
                ...result
            }
        })

        // Create certificate if score is >= 70
        if (result.overallScore >= 70 && session) {
            await tx.certificate.create({
                data: {
                    userId: session.userId,
                    sessionId,
                    title: `Certified ${session.pack.role} - ${session.pack.level}`,
                    score: result.overallScore
                }
            })
        }

        // Update session
        await tx.interviewSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                endedAt: new Date()
            }
        })
    })

    logger.interviewEnd(sessionId, session.userId, session.packId, 'COMPLETED')
    redirect(`/interview/${sessionId}/results`)
}
