'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle2, Circle } from 'lucide-react'
import styles from './InterviewProgress.module.css'

interface InterviewProgressData {
    currentPhase: 'introduction' | 'topics' | 'wrapup'
    currentTopic?: {
        id: string
        name: string
        index: number
        total: number
    }
    topicsCovered: string[]
    topicsRemaining: string[]
    timeElapsed: number
    estimatedTimeRemaining: number
    progressPercentage: number
}

interface InterviewProgressProps {
    sessionId: string
}

export default function InterviewProgress({ sessionId }: InterviewProgressProps) {
    const [progress, setProgress] = useState<InterviewProgressData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Fetch progress every 10 seconds
        const fetchProgress = async () => {
            try {
                const response = await fetch(`/api/interview/${sessionId}/progress`)
                if (response.ok) {
                    const data = await response.json()
                    setProgress(data)
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProgress()
        const interval = setInterval(fetchProgress, 10000) // Update every 10 seconds

        return () => clearInterval(interval)
    }, [sessionId])

    // TESTING MODE: Interview is 20 minutes (was 60)
    const maxDuration = 20

    // Format time display
    const formatTime = (minutes: number): string => {
        if (minutes < maxDuration) {
            return `${minutes}m`
        }
        const hours = Math.floor(minutes / maxDuration)
        const mins = minutes % maxDuration
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }

    if (isLoading || !progress) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading progress...</div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            {/* Progress Bar */}
            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${progress.progressPercentage}%` }}
                />
            </div>

            {/* Current Topic */}
            {progress.currentTopic && (
                <div className={styles.currentTopic}>
                    <span className={styles.topicLabel}>Current Topic:</span>
                    <span className={styles.topicName}>
                        {progress.currentTopic.index}/{progress.currentTopic.total}: {progress.currentTopic.name}
                    </span>
                </div>
            )}

            {/* Phase Indicator */}
            <div className={styles.phaseIndicator}>
                <span className={styles.phaseLabel}>Phase:</span>
                <span className={`${styles.phase} ${styles[progress.currentPhase]}`}>
                    {progress.currentPhase === 'introduction' && 'Introduction'}
                    {progress.currentPhase === 'topics' && 'Technical Topics'}
                    {progress.currentPhase === 'wrapup' && 'Wrap-up'}
                </span>
            </div>

            {/* Time Info */}
            <div className={styles.timeInfo}>
                <div className={styles.timeItem}>
                    <Clock size={16} />
                    <span>Elapsed: {formatTime(progress.timeElapsed)}</span>
                </div>
                <div className={styles.timeItem}>
                    <Clock size={16} />
                    <span>Remaining: ~{formatTime(progress.estimatedTimeRemaining)}</span>
                </div>
            </div>

            {/* Topics Status */}
            {progress.topicsCovered.length > 0 && (
                <div className={styles.topicsStatus}>
                    <div className={styles.topicsCovered}>
                        <CheckCircle2 size={14} />
                        <span>{progress.topicsCovered.length} topics covered</span>
                    </div>
                    {progress.topicsRemaining.length > 0 && (
                        <div className={styles.topicsRemaining}>
                            <Circle size={14} />
                            <span>{progress.topicsRemaining.length} remaining</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

