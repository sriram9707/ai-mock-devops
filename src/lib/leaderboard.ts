'use server'

import prisma from '@/lib/prisma'

export interface LeaderboardEntry {
    rank: number
    userId: string
    userName: string | null
    userEmail: string
    averageScore: number
    totalSessions: number
    certificatesEarned: number
    bestScore: number
    recentActivity: string // ISO date string
}

export interface LeaderboardData {
    topPerformers: LeaderboardEntry[]
    recentCompletions: LeaderboardEntry[]
}

export async function getLeaderboard(): Promise<LeaderboardData> {
    // Get all completed sessions with results
    const sessions = await prisma.interviewSession.findMany({
        where: {
            status: 'COMPLETED',
            result: {
                isNot: null
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            result: true,
            certificate: true
        }
    })

    // Group by user
    const userMap = new Map<string, {
        userId: string
        userName: string | null
        userEmail: string
        scores: number[]
        certificates: number
        lastActivity: Date
    }>()

    sessions.forEach(session => {
        if (!session.result) return

        const userId = session.userId
        if (!userMap.has(userId)) {
            userMap.set(userId, {
                userId,
                userName: session.user.name,
                userEmail: session.user.email,
                scores: [],
                certificates: 0,
                lastActivity: session.endedAt || session.createdAt
            })
        }

        const userData = userMap.get(userId)!
        userData.scores.push(session.result.overallScore)
        if (session.certificate) {
            userData.certificates++
        }
        if (session.endedAt && session.endedAt > userData.lastActivity) {
            userData.lastActivity = session.endedAt
        }
    })

    // Convert to leaderboard entries
    const entries: LeaderboardEntry[] = Array.from(userMap.values())
        .filter(user => user.scores.length > 0)
        .map(user => ({
            rank: 0, // Will be set after sorting
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            averageScore: user.scores.reduce((a, b) => a + b, 0) / user.scores.length,
            totalSessions: user.scores.length,
            certificatesEarned: user.certificates,
            bestScore: Math.max(...user.scores),
            recentActivity: user.lastActivity.toISOString()
        }))

    // Sort by average score (descending)
    entries.sort((a, b) => b.averageScore - a.averageScore)

    // Assign ranks
    entries.forEach((entry, idx) => {
        entry.rank = idx + 1
    })

    // Top performers (top 20)
    const topPerformers = entries.slice(0, 20)

    // Recent completions (sorted by recent activity, last 20)
    const recentCompletions = [...entries]
        .sort((a, b) => new Date(b.recentActivity).getTime() - new Date(a.recentActivity).getTime())
        .slice(0, 20)

    return {
        topPerformers,
        recentCompletions
    }
}

