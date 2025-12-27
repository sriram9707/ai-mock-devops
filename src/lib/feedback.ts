'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export interface InterviewFeedback {
    sessionId: string
    scoringAccuracy: number // 1-5 scale
    questionRealism: boolean
    wouldRetake: boolean
    wouldRecommend: number // NPS: 0-10
    improvements?: string // Open text
    overallRating: number // 1-5 scale
}

/**
 * Submit feedback for an interview session
 */
export async function submitFeedback(feedback: InterviewFeedback): Promise<void> {
    const user = await getSession()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // Verify session belongs to user
    const session = await prisma.interviewSession.findUnique({
        where: { id: feedback.sessionId }
    })

    if (!session || session.userId !== user.id) {
        throw new Error('Session not found or unauthorized')
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.interviewFeedback.findUnique({
        where: { sessionId: feedback.sessionId }
    })

    if (existingFeedback) {
        // Update existing feedback
        await prisma.interviewFeedback.update({
            where: { sessionId: feedback.sessionId },
            data: {
                scoringAccuracy: feedback.scoringAccuracy,
                questionRealism: feedback.questionRealism,
                wouldRetake: feedback.wouldRetake,
                wouldRecommend: feedback.wouldRecommend,
                overallRating: feedback.overallRating,
                improvements: feedback.improvements || null
            }
        })
    } else {
        // Create new feedback
        await prisma.interviewFeedback.create({
            data: {
                sessionId: feedback.sessionId,
                userId: user.id,
                scoringAccuracy: feedback.scoringAccuracy,
                questionRealism: feedback.questionRealism,
                wouldRetake: feedback.wouldRetake,
                wouldRecommend: feedback.wouldRecommend,
                overallRating: feedback.overallRating,
                improvements: feedback.improvements || null
            }
        })
    }
}

/**
 * Get feedback summary for a session
 */
export async function getSessionFeedback(sessionId: string): Promise<InterviewFeedback | null> {
    const feedback = await prisma.interviewFeedback.findUnique({
        where: { sessionId }
    })

    if (!feedback) return null

    return {
        sessionId: feedback.sessionId,
        scoringAccuracy: feedback.scoringAccuracy,
        questionRealism: feedback.questionRealism,
        wouldRetake: feedback.wouldRetake,
        wouldRecommend: feedback.wouldRecommend,
        overallRating: feedback.overallRating,
        improvements: feedback.improvements || undefined
    }
}

/**
 * Get aggregate feedback metrics
 */
export async function getFeedbackMetrics(): Promise<{
    averageScoringAccuracy: number
    averageQuestionRealism: number // % who said yes
    retakeRate: number // % who said yes
    npsScore: number
    averageOverallRating: number
    topImprovements: string[]
}> {
    const allFeedback = await prisma.interviewFeedback.findMany()

    if (allFeedback.length === 0) {
        return {
            averageScoringAccuracy: 0,
            averageQuestionRealism: 0,
            retakeRate: 0,
            npsScore: 0,
            averageOverallRating: 0,
            topImprovements: []
        }
    }

    const averageScoringAccuracy = allFeedback.reduce((sum, f) => sum + f.scoringAccuracy, 0) / allFeedback.length
    const averageQuestionRealism = (allFeedback.filter(f => f.questionRealism).length / allFeedback.length) * 100
    const retakeRate = (allFeedback.filter(f => f.wouldRetake).length / allFeedback.length) * 100
    
    // Calculate NPS: % promoters (9-10) - % detractors (0-6)
    const promoters = allFeedback.filter(f => f.wouldRecommend >= 9).length
    const detractors = allFeedback.filter(f => f.wouldRecommend <= 6).length
    const npsScore = ((promoters - detractors) / allFeedback.length) * 100
    
    const averageOverallRating = allFeedback.reduce((sum, f) => sum + f.overallRating, 0) / allFeedback.length

    // Extract improvements (simple approach - could be enhanced with NLP)
    const improvements = allFeedback
        .filter(f => f.improvements && f.improvements.trim().length > 0)
        .map(f => f.improvements!)
        .slice(0, 10) // Top 10

    return {
        averageScoringAccuracy: Math.round(averageScoringAccuracy * 10) / 10,
        averageQuestionRealism: Math.round(averageQuestionRealism * 10) / 10,
        retakeRate: Math.round(retakeRate * 10) / 10,
        npsScore: Math.round(npsScore * 10) / 10,
        averageOverallRating: Math.round(averageOverallRating * 10) / 10,
        topImprovements: improvements
    }
}

