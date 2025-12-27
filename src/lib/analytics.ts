'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export interface AnalyticsData {
    totalSessions: number
    completedSessions: number
    averageScore: number
    scoreTrend: Array<{ date: string; score: number }>
    competencyBreakdown: Array<{ competency: string; averageScore: number; trend: 'up' | 'down' | 'stable' }>
    weakAreas: string[]
    strongAreas: string[]
    certificatesEarned: number
    improvementRate: number // Percentage improvement over time
    recentActivity: Array<{
        date: string
        packTitle: string
        score: number
        status: string
    }>
}

export async function getUserAnalytics(): Promise<AnalyticsData> {
    const user = await getSession()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // Get all user sessions with results
    const sessions = await prisma.interviewSession.findMany({
        where: {
            userId: user.id,
            status: 'COMPLETED'
        },
        include: {
            result: true,
            pack: true,
            certificate: true
        },
        orderBy: {
            endedAt: 'desc'
        }
    })

    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.result).length
    const certificatesEarned = sessions.filter(s => s.certificate).length

    // Calculate average score
    const scores = sessions
        .filter(s => s.result)
        .map(s => s.result!.overallScore)

    const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0

    // Score trend (last 10 sessions)
    const recentSessions = sessions
        .filter(s => s.result && s.endedAt)
        .slice(0, 10)
        .reverse()

    const scoreTrend = recentSessions.map(s => ({
        date: s.endedAt!.toISOString().split('T')[0],
        score: s.result!.overallScore
    }))

    // Calculate improvement rate
    let improvementRate = 0
    if (recentSessions.length >= 2) {
        const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2))
        const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2))

        const firstAvg = firstHalf.reduce((sum, s) => sum + s.result!.overallScore, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, s) => sum + s.result!.overallScore, 0) / secondHalf.length

        if (firstAvg > 0) {
            improvementRate = ((secondAvg - firstAvg) / firstAvg) * 100
        }
    }

    // Competency breakdown
    const competencyMap = new Map<string, number[]>()

    sessions.forEach(session => {
        if (session.result && session.result.competencyScores) {
            try {
                const competencies = JSON.parse(session.result.competencyScores) as Record<string, number>
                Object.entries(competencies).forEach(([key, value]) => {
                    if (!competencyMap.has(key)) {
                        competencyMap.set(key, [])
                    }
                    if (typeof value === 'number' && !isNaN(value)) {
                        competencyMap.get(key)!.push(value)
                    }
                })
            } catch (error) {
                console.error('Failed to parse competency scores:', error)
            }
        }
    })

    const competencyBreakdown = Array.from(competencyMap.entries()).map(([competency, scores]) => {
        const average = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0

        // Determine trend (compare first half vs second half)
        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (scores.length >= 4) {
            const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
            const secondHalf = scores.slice(Math.floor(scores.length / 2))
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

            if (secondAvg > firstAvg + 2) trend = 'up'
            else if (secondAvg < firstAvg - 2) trend = 'down'
        }

        return {
            competency: competency.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            averageScore: Math.round(average * 10) / 10,
            trend
        }
    }).sort((a, b) => b.averageScore - a.averageScore)

    // Weak and strong areas
    const weakAreas = competencyBreakdown
        .filter(c => c.averageScore < 70)
        .map(c => c.competency)
        .slice(0, 5)

    const strongAreas = competencyBreakdown
        .filter(c => c.averageScore >= 80)
        .map(c => c.competency)
        .slice(0, 5)

    // Recent activity
    const recentActivity = sessions
        .filter(s => s.endedAt)
        .slice(0, 5)
        .map(s => ({
            date: s.endedAt!.toISOString().split('T')[0],
            packTitle: s.pack.title,
            score: s.result?.overallScore || 0,
            status: s.status
        }))

    return {
        totalSessions,
        completedSessions,
        averageScore: Math.round(averageScore * 10) / 10,
        scoreTrend,
        competencyBreakdown,
        weakAreas,
        strongAreas,
        certificatesEarned,
        improvementRate: Math.round(improvementRate * 10) / 10,
        recentActivity
    }
}

