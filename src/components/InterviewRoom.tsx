'use client'

import { useState, useRef, useEffect } from 'react'
import { submitAnswer } from '@/lib/interview-chat'
import { finishInterview } from '@/lib/interview-finish'
import { useRouter } from 'next/navigation'
import styles from './InterviewRoom.module.css'
import { Mic, MicOff, Send, Video, PhoneOff } from 'lucide-react'
import { useVapi } from '@/hooks/use-vapi'
import InterviewProgress from './InterviewProgress'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function InterviewRoom({
    sessionId,
    initialMessage,
    isPractice = false
}: {
    sessionId: string
    initialMessage: string
    isPractice?: boolean
}) {
    const { isConnected, isSpeaking, transcript, callEndReason, startInterview, stopInterview, toggleMute } = useVapi()
    const [hasStarted, setHasStarted] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hintsEnabled, setHintsEnabled] = useState(false) // AI hints toggle (only in practice mode)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Removed transcript scroll effect - no longer displaying transcripts

    // Handle unexpected call endings
    useEffect(() => {
        if (callEndReason && hasStarted && !isConnected) {
            console.warn("Call ended unexpectedly:", callEndReason)
            // Show user-friendly error message
            if (callEndReason.includes('ejection') || callEndReason.includes('Meeting has ended')) {
                setError("The interview call ended unexpectedly. This may be due to network issues or a timeout. You can try starting again.")
                // Reset hasStarted to allow restart
                setHasStarted(false)
            }
        }
    }, [callEndReason, hasStarted, isConnected])

    const handleStart = async () => {
        setHasStarted(true)
        setError(null)

        try {
            // 1. Explicitly check/request microphone permission
            console.log("Checking microphone permissions...")
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Stop the stream immediately, we just needed permission
            stream.getTracks().forEach(track => track.stop())
            console.log("Microphone permission granted.")

            // 2. Start the Vapi Interview
            // We pass a placeholder system prompt because the SERVER generates the real one based on sessionId
            await startInterview(sessionId, "Placeholder-System-Prompt", initialMessage)

        } catch (error: any) {
            console.error("Failed to start interview:", error)
            setHasStarted(false)

            let errorMessage = error?.message || 'Unknown error.'

            // Helpful messages for common permission errors
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = "Microphone permission denied. Please allow microphone access in your browser settings."
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = "No microphone found. Please connect a microphone."
            } else if (errorMessage.includes('ejection') || errorMessage.includes('Meeting has ended')) {
                errorMessage = "The call ended unexpectedly. Please try again."
            } else if (errorMessage === 'Unknown error.') {
                errorMessage = 'Unknown error. Please check your browser console and ensure Vapi is properly configured.'
            }

            setError(errorMessage)
        }
    }

    const handleEndInterview = async () => {
        if (confirm('Are you sure you want to end the interview?')) {
            stopInterview()
            try {
                // This will generate results and redirect to results page
                await finishInterview(sessionId)
            } catch (error) {
                console.error('Failed to finish interview:', error)
                // If finishInterview fails, still redirect but show error
                router.push(`/interview/${sessionId}/results`)
            }
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.avatarArea}>
                <div className={`${styles.avatarPlaceholder} ${isSpeaking ? styles.speaking : ''}`}>
                    <div className={styles.ring}></div>
                    <Video size={48} className={styles.avatarIcon} />
                    <span>{isConnected ? "Alex (Connected)" : "AI Interviewer"}</span>
                </div>

                {!hasStarted || (!isConnected && hasStarted) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        {!hasStarted ? (
                            <button className={styles.startButton} onClick={handleStart}>
                                <Mic size={20} /> Start Interview
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ color: '#fee2e2', fontSize: '0.875rem', textAlign: 'center' }}>
                                    Connection lost
                                </div>
                                <button className={styles.startButton} onClick={handleStart}>
                                    <Mic size={20} /> Restart Interview
                                </button>
                            </div>
                        )}
                        {error && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 'var(--radius)',
                                color: '#fee2e2',
                                fontSize: '0.875rem',
                                maxWidth: '300px',
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.controls}>
                        <button
                            className={`${styles.controlButton} ${isMuted ? styles.muted : ''}`}
                            onClick={() => {
                                const newMutedState = !isMuted
                                setIsMuted(newMutedState)
                                toggleMute(newMutedState)
                            }}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button className={`${styles.controlButton} ${styles.danger}`} onClick={handleEndInterview} title="End Interview">
                            <PhoneOff size={20} />
                        </button>
                    </div>
                )}

                {/* AI Hints Toggle - Top Right (only in practice mode) */}
                {hasStarted && isConnected && isPractice && (
                    <button
                        className={`${styles.hintsButtonTop} ${hintsEnabled ? styles.hintsEnabled : ''}`}
                        onClick={() => setHintsEnabled(!hintsEnabled)}
                        title={hintsEnabled ? "Hints Enabled - Click to disable" : "Hints Disabled - Click to enable"}
                    >
                        💡
                    </button>
                )}

                {/* Progress Indicator - shown at top when interview is active */}
                {hasStarted && isConnected && (
                    <div className={styles.progressWrapper}>
                        <InterviewProgress sessionId={sessionId} />
                    </div>
                )}

                {/* Voice indicator - shown during active interview */}
                {hasStarted && isConnected && (
                    <div className={styles.voiceOnlyIndicator}>
                        <div className={styles.voiceIcon}>
                            <Mic size={24} />
                        </div>
                        <p>Voice interview in progress...</p>
                        <p className={styles.subtext}>Speak naturally. Your responses are being recorded.</p>
                        {isPractice && hintsEnabled && (
                            <div className={styles.hintsIndicator}>
                                <span className={styles.hintsBadge}>💡 AI Hints Enabled</span>
                                <p className={styles.hintsHint}>Say "I need a hint" or "Can you help me?" to get guidance</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
