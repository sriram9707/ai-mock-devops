'use server'

import prisma from '@/lib/prisma'

/**
 * Track key validation metrics for product-market fit
 */

export interface ValidationMetrics {
    // Engagement metrics
    totalUsers: number
    activeUsers: number // Users who completed at least 1 interview
    totalSessions: number
    completedSessions: number
    completionRate: number // % of sessions completed
    retakeRate: number // % of users who retook interviews
    averageSessionsPerUser: number
    
    // Quality metrics
    averageScore: number
    averageInterviewDuration: number // minutes
    averageTurnsPerSession: number
    
    // User satisfaction (from feedback)
    averageSatisfactionScore: number // 1-5 scale
    npsScore: number // Net Promoter Score
    
    // Growth metrics
    certificatesEarned: number
    certificatesShared: number
    referralRate: number // % of users who referred others
    
    // Cost metrics
    estimatedCostPerInterview: number // Based on API usage
    
    // Time metrics
    averageTimeToFirstInterview: number // minutes from signup to first interview
}

/**
 * Get comprehensive validation metrics
 */
export async function getValidationMetrics(): Promise<ValidationMetrics> {
    const users = await prisma.user.findMany({
        include: {
            sessions: {
                include: {
                    result: true,
                    certificate: true,
                    turns: true
                }
            },
            profile: true
        }
    })

    const totalUsers = users.length
    const activeUsers = users.filter(u => u.sessions.length > 0).length
    
    const allSessions = users.flatMap(u => u.sessions)
    const totalSessions = allSessions.length
    const completedSessions = allSessions.filter(s => s.status === 'COMPLETED').length
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    
    // Retake rate: users who have >1 completed session
    const usersWithRetakes = users.filter(u => 
        u.sessions.filter(s => s.status === 'COMPLETED').length > 1
    ).length
    const retakeRate = activeUsers > 0 ? (usersWithRetakes / activeUsers) * 100 : 0
    
    const averageSessionsPerUser = activeUsers > 0 ? totalSessions / activeUsers : 0
    
    // Score metrics
    const scores = allSessions
        .filter(s => s.result)
        .map(s => s.result!.overallScore)
    const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0
    
    // Duration metrics
    const sessionsWithDuration = allSessions.filter(s => 
        s.startedAt && s.endedAt
    )
    const durations = sessionsWithDuration.map(s => {
        const ms = s.endedAt!.getTime() - s.startedAt!.getTime()
        return ms / (1000 * 60) // Convert to minutes
    })
    const averageInterviewDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0
    
    // Turns per session
    const turnsPerSession = allSessions.map(s => s.turns.length)
    const averageTurnsPerSession = turnsPerSession.length > 0
        ? turnsPerSession.reduce((a, b) => a + b, 0) / turnsPerSession.length
        : 0
    
    // Certificates
    const certificatesEarned = allSessions.filter(s => s.certificate).length
    const certificatesShared = await prisma.certificate.count({
        where: {
            shareToken: { not: null }
        }
    })
    
    // Time to first interview
    const timeToFirstInterview = users
        .filter(u => u.sessions.length > 0 && u.sessions[0].startedAt)
        .map(u => {
            const signupTime = u.createdAt.getTime()
            const firstInterviewTime = u.sessions[0].startedAt!.getTime()
            return (firstInterviewTime - signupTime) / (1000 * 60) // minutes
        })
    const averageTimeToFirstInterview = timeToFirstInterview.length > 0
        ? timeToFirstInterview.reduce((a, b) => a + b, 0) / timeToFirstInterview.length
        : 0
    
    // Cost estimation (rough: ~$2-5 per interview based on API usage)
    // This is a placeholder - you'd track actual API costs
    const estimatedCostPerInterview = 3.0
    
    // User satisfaction (placeholder - would come from feedback table)
    // TODO: Add feedback table to schema
    const averageSatisfactionScore = 0 // Placeholder
    const npsScore = 0 // Placeholder
    
    // Referral rate (placeholder - would track referrals)
    const referralRate = 0 // Placeholder

    return {
        totalUsers,
        activeUsers,
        totalSessions,
        completedSessions,
        completionRate: Math.round(completionRate * 10) / 10,
        retakeRate: Math.round(retakeRate * 10) / 10,
        averageSessionsPerUser: Math.round(averageSessionsPerUser * 10) / 10,
        averageScore: Math.round(averageScore * 10) / 10,
        averageInterviewDuration: Math.round(averageInterviewDuration * 10) / 10,
        averageTurnsPerSession: Math.round(averageTurnsPerSession * 10) / 10,
        averageSatisfactionScore,
        npsScore,
        certificatesEarned,
        certificatesShared,
        referralRate,
        estimatedCostPerInterview,
        averageTimeToFirstInterview: Math.round(averageTimeToFirstInterview * 10) / 10
    }
}

/**
 * Track a specific event (for future analytics)
 */
export async function trackEvent(
    userId: string,
    eventType: string,
    metadata?: Record<string, any>
): Promise<void> {
    // TODO: Implement event tracking table
    // For now, just log
    console.log('Event tracked:', { userId, eventType, metadata })
}

