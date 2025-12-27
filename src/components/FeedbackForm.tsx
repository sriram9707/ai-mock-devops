'use client'

import { useState } from 'react'
import { submitFeedback } from '@/lib/feedback'
import { MessageSquare, Star, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react'
import styles from './FeedbackForm.module.css'

interface FeedbackFormProps {
    sessionId: string
}

export function FeedbackForm({ sessionId }: FeedbackFormProps) {
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        scoringAccuracy: 0,
        questionRealism: true,
        wouldRetake: true,
        wouldRecommend: 0,
        overallRating: 0,
        improvements: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await submitFeedback({
                sessionId,
                ...formData
            })
            setSubmitted(true)
        } catch (error) {
            console.error('Failed to submit feedback:', error)
            alert('Failed to submit feedback. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className={styles.container}>
                <div className={styles.success}>
                    <CheckCircle className={styles.successIcon} />
                    <h3>Thank you for your feedback!</h3>
                    <p>Your input helps us improve the platform.</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <MessageSquare className={styles.icon} />
                <h3>How was your interview experience?</h3>
                <p>Your feedback helps us improve</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Scoring Accuracy */}
                <div className={styles.field}>
                    <label>How accurate was the scoring? (1-5)</label>
                    <div className={styles.starRating}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`${styles.star} ${formData.scoringAccuracy >= star ? styles.active : ''}`}
                                onClick={() => setFormData({ ...formData, scoringAccuracy: star })}
                            >
                                <Star size={24} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question Realism */}
                <div className={styles.field}>
                    <label>Did the questions feel realistic?</label>
                    <div className={styles.toggleGroup}>
                        <button
                            type="button"
                            className={`${styles.toggle} ${formData.questionRealism ? styles.active : ''}`}
                            onClick={() => setFormData({ ...formData, questionRealism: true })}
                        >
                            <ThumbsUp size={20} />
                            Yes
                        </button>
                        <button
                            type="button"
                            className={`${styles.toggle} ${!formData.questionRealism ? styles.active : ''}`}
                            onClick={() => setFormData({ ...formData, questionRealism: false })}
                        >
                            <ThumbsDown size={20} />
                            No
                        </button>
                    </div>
                </div>

                {/* Would Retake */}
                <div className={styles.field}>
                    <label>Would you retake this interview?</label>
                    <div className={styles.toggleGroup}>
                        <button
                            type="button"
                            className={`${styles.toggle} ${formData.wouldRetake ? styles.active : ''}`}
                            onClick={() => setFormData({ ...formData, wouldRetake: true })}
                        >
                            Yes
                        </button>
                        <button
                            type="button"
                            className={`${styles.toggle} ${!formData.wouldRetake ? styles.active : ''}`}
                            onClick={() => setFormData({ ...formData, wouldRetake: false })}
                        >
                            No
                        </button>
                    </div>
                </div>

                {/* NPS - Would Recommend */}
                <div className={styles.field}>
                    <label>How likely are you to recommend this to a friend? (0-10)</label>
                    <div className={styles.npsScale}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button
                                key={num}
                                type="button"
                                className={`${styles.npsButton} ${formData.wouldRecommend === num ? styles.active : ''}`}
                                onClick={() => setFormData({ ...formData, wouldRecommend: num })}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    <div className={styles.npsLabels}>
                        <span>Not likely</span>
                        <span>Very likely</span>
                    </div>
                </div>

                {/* Overall Rating */}
                <div className={styles.field}>
                    <label>Overall rating (1-5)</label>
                    <div className={styles.starRating}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                className={`${styles.star} ${formData.overallRating >= star ? styles.active : ''}`}
                                onClick={() => setFormData({ ...formData, overallRating: star })}
                            >
                                <Star size={24} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Improvements */}
                <div className={styles.field}>
                    <label htmlFor="improvements">What would you improve? (Optional)</label>
                    <textarea
                        id="improvements"
                        rows={4}
                        value={formData.improvements}
                        onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                        placeholder="Share your thoughts..."
                        className={styles.textarea}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || formData.scoringAccuracy === 0 || formData.overallRating === 0 || formData.wouldRecommend === 0}
                    className={styles.submitButton}
                >
                    {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
            </form>
        </div>
    )
}

