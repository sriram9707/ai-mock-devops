'use server'

import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { scoreInterview } from '@/lib/ai/scoring'

export async function finishInterview(sessionId: string) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    // Get session to check if it's practice mode
    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { pack: true }
    })

    if (!session) {
        throw new Error('Session not found')
    }

    // In practice mode, skip scoring and just mark as completed
    if (session.isPractice) {
        await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                endedAt: new Date()
            }
        })
        redirect(`/interview/${sessionId}/results`)
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

    // Score the interview using LLM evaluation (real interview mode), passing previous result
    const scoring = await scoreInterview(sessionId, previousSession?.result)

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

    redirect(`/interview/${sessionId}/results`)
}
