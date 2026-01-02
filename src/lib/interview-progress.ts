'use server'

import prisma from '@/lib/prisma'
import { getInterviewStructure } from './ai/interview-flow'
import { inferTopicFromQuestion } from './topic-utils'

export interface InterviewProgress {
    currentPhase: 'introduction' | 'topics' | 'wrapup'
    currentTopic?: {
        id: string
        name: string
        index: number
        total: number
    }
    topicsCovered: string[]
    topicsRemaining: string[]
    timeElapsed: number // minutes
    estimatedTimeRemaining: number // minutes
    progressPercentage: number // 0-100
}

/**
 * Get interview progress based on session turns and metadata
 */
export async function getInterviewProgress(sessionId: string): Promise<InterviewProgress> {
    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
            pack: true,
            turns: {
                orderBy: { createdAt: 'asc' },
                where: {
                    role: 'interviewer',
                    section: { not: null }
                }
            }
        }
    })

    if (!session || !session.pack) {
        throw new Error('Session not found')
    }

    // Get interview structure
    const structure = getInterviewStructure(session.pack.level)
    const allTopics = structure.topics

    // Calculate time elapsed
    const startTime = session.startedAt || session.createdAt
    const now = new Date()
    const timeElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60) // minutes

    // Determine current phase based on time and turns
    let currentPhase: 'introduction' | 'topics' | 'wrapup' = 'introduction'

    if (timeElapsed < 5) {
        currentPhase = 'introduction'
    } else if (timeElapsed < 50) {
        currentPhase = 'topics'
    } else {
        currentPhase = 'wrapup'
    }

    // Extract topics covered from turns
    const topicsCoveredSet = new Set<string>()
    session.turns.forEach(turn => {
        if (turn.section) {
            topicsCoveredSet.add(turn.section)
        }
    })
    const topicsCovered = Array.from(topicsCoveredSet)

    // Determine current topic (last mentioned topic, or first uncovered)
    let currentTopic: InterviewProgress['currentTopic'] | undefined
    const allTopicIds = allTopics.map(t => t.id)
    const topicsRemaining = allTopicIds.filter(id => !topicsCovered.includes(id))

    if (currentPhase === 'topics') {
        // Current topic is the last one mentioned, or first uncovered
        const lastTopicId = topicsCovered[topicsCovered.length - 1]
        const currentTopicId = lastTopicId || topicsRemaining[0] || allTopicIds[0]

        const topicIndex = allTopicIds.indexOf(currentTopicId)
        const topic = allTopics.find(t => t.id === currentTopicId)

        if (topic) {
            currentTopic = {
                id: topic.id,
                name: topic.name,
                index: topicIndex + 1,
                total: allTopicIds.length
            }
        }
    }

    // TESTING MODE: Fixed 20-minute interview duration
    const totalEstimatedTime = 20 // minutes (was calculated from topics)
    const estimatedTimeRemaining = Math.max(0, totalEstimatedTime - timeElapsed)

    // Calculate progress percentage
    const progressPercentage = Math.min(100, Math.round((timeElapsed / totalEstimatedTime) * 100))

    return {
        currentPhase,
        currentTopic,
        topicsCovered,
        topicsRemaining,
        timeElapsed,
        estimatedTimeRemaining,
        progressPercentage
    }
}


