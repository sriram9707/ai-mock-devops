'use server'

import prisma from '@/lib/prisma'
import { hashQuestion, isQuestion } from '@/lib/question-utils'
import { inferTopicFromQuestion } from './topic-utils'

/**
 * Get all previous questions asked to this user for this interview pack
 * Returns array of question texts from previous completed sessions
 * @param userId - User ID
 * @param packId - Interview pack ID
 * @param excludeSessionId - Optional session ID to exclude (current session)
 */
export async function getPreviousQuestions(
    userId: string, 
    packId: string, 
    excludeSessionId?: string
): Promise<string[]> {
    // Get all completed sessions for this user and pack
    const previousSessions = await prisma.interviewSession.findMany({
        where: {
            userId,
            packId,
            status: 'COMPLETED',
            ...(excludeSessionId && { id: { not: excludeSessionId } })
        },
        include: {
            turns: {
                where: {
                    role: 'interviewer',
                    isQuestion: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            }
        },
        orderBy: {
            endedAt: 'desc'
        },
        take: 10 // Limit to last 10 sessions to avoid too much context
    })

    // Extract unique questions (using hash for deduplication)
    const questionHashes = new Set<string>()
    const questions: string[] = []

    for (const session of previousSessions) {
        for (const turn of session.turns) {
            if (turn.questionHash && !questionHashes.has(turn.questionHash)) {
                questionHashes.add(turn.questionHash)
                questions.push(turn.message)
            }
        }
    }

    return questions
}

/**
 * Save a question turn with tracking metadata
 */
export async function saveQuestionTurn(
    sessionId: string,
    questionText: string
): Promise<void> {
    const questionHash = hashQuestion(questionText)
    const isQ = isQuestion(questionText)
    
    // Infer topic/section from question content for progress tracking
    const section = inferTopicFromQuestion(questionText)

    await prisma.interviewTurn.create({
        data: {
            sessionId,
            role: 'interviewer',
            message: questionText,
            isQuestion: isQ,
            questionHash: isQ ? questionHash : null,
            section: section || null // Track which topic this question belongs to
        }
    })
}

