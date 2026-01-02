import { getSession } from '@/lib/auth'
import { getUserAnalytics } from '@/lib/analytics'
import { redirect } from 'next/navigation'
import styles from './page.module.css'
import { TrendingUp, TrendingDown, Award, Target, Activity, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function FeedbackSummaryPage() {
    const user = await getSession()
    if (!user) {
        redirect('/login')
    }

    const analytics = await getUserAnalytics()

    // Group activities by date for easier filtering
    const activitiesByDate = analytics.recentActivity.reduce((acc, activity) => {
        const date = new Date(activity.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        if (!acc[date]) {
            acc[date] = []
        }
        acc[date].push(activity)
        return acc
    }, {} as Record<string, typeof analytics.recentActivity>)

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Feedback Summary</h1>
                    <p className={styles.subtitle}>Comprehensive analysis of your interview performance</p>
                </div>
                <Link href="/dashboard" className={styles.backButton}>
                    ← Back to Dashboard
                </Link>
            </header>

            {/* === SECTION 1: COMPREHENSIVE FEEDBACK (TOP) === */}

            {/* Overview Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Activity size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{analytics.completedSessions}</div>
                        <div className={styles.statLabel}>Total Sessions</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Target size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{analytics.averageScore}</div>
                        <div className={styles.statLabel}>Average Score</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        {analytics.improvementRate >= 0 ? (
                            <TrendingUp size={24} className={styles.trendUp} />
                        ) : (
                            <TrendingDown size={24} className={styles.trendDown} />
                        )}
                    </div>
                    <div className={styles.statContent}>
                        <div className={`${styles.statValue} ${analytics.improvementRate >= 0 ? styles.trendUp : styles.trendDown}`}>
                            {analytics.improvementRate >= 0 ? '+' : ''}{analytics.improvementRate}%
                        </div>
                        <div className={styles.statLabel}>Improvement Rate</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Award size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{analytics.certificatesEarned}</div>
                        <div className={styles.statLabel}>Certificates</div>
                    </div>
                </div>
            </div>

            {/* Key Areas Summary (Strengths & Weaknesses) */}
            <div className={styles.feedbackGrid}>
                {analytics.strongAreas.length > 0 && (
                    <div className={styles.feedbackCard}>
                        <div className={styles.feedbackHeader}>
                            <Award size={20} className={styles.successIcon} />
                            <h3 className={styles.feedbackTitle}>Your Strengths</h3>
                        </div>
                        <ul className={styles.feedbackList}>
                            {analytics.strongAreas.map((area, idx) => (
                                <li key={idx} className={styles.feedbackItem}>
                                    <span className={styles.checkmark}>✓</span>
                                    {area}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {analytics.weakAreas.length > 0 && (
                    <div className={styles.feedbackCard}>
                        <div className={styles.feedbackHeader}>
                            <Target size={20} className={styles.warningIcon} />
                            <h3 className={styles.feedbackTitle}>Focus Areas</h3>
                        </div>
                        <ul className={styles.feedbackList}>
                            {analytics.weakAreas.map((area, idx) => (
                                <li key={idx} className={styles.feedbackItem}>
                                    <span className={styles.bullet}>•</span>
                                    {area}
                                </li>
                            ))}
                        </ul>
                        <div className={styles.recommendationNote}>
                            <FileText size={16} />
                            <span>Prioritize these areas in your next practice session</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Interview Sessions by Date */}
            {Object.keys(activitiesByDate).length > 0 && (
                <div className={styles.sessionsCard}>
                    <div className={styles.sectionHeader}>
                        <Calendar size={20} />
                        <h2 className={styles.sectionTitle}>Interview History by Date</h2>
                    </div>

                    <div className={styles.sessionsList}>
                        {Object.entries(activitiesByDate).map(([date, activities]) => (
                            <div key={date} className={styles.dateGroup}>
                                <div className={styles.dateHeader}>{date}</div>
                                {activities.map((activity, idx) => (
                                    <div key={idx} className={styles.sessionItem}>
                                        <div className={styles.sessionContent}>
                                            <div className={styles.sessionTitle}>{activity.packTitle}</div>
                                            <div className={styles.sessionScore}>
                                                <span className={styles.scoreLabel}>Score:</span>
                                                <span className={`${styles.scoreValue} ${activity.score >= 70 ? styles.scoreGood : styles.scoreNeedsWork}`}>
                                                    {activity.score}/100
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === SECTION 2: RUBRICS & SCORES (BOTTOM) === */}

            {/* Score Progress Chart */}
            {analytics.scoreTrend.length > 0 && (
                <div className={styles.chartCard}>
                    <div className={styles.sectionHeader}>
                        <TrendingUp size={20} />
                        <h2 className={styles.sectionTitle}>Score Progression</h2>
                    </div>
                    <div className={styles.chartContainer}>
                        <div className={styles.chart}>
                            {analytics.scoreTrend.map((point, idx) => {
                                const maxScore = 100
                                const height = (point.score / maxScore) * 100
                                return (
                                    <div key={idx} className={styles.barContainer}>
                                        <div
                                            className={styles.bar}
                                            style={{ height: `${height}%` }}
                                            title={`${point.date}: ${point.score}`}
                                        />
                                        <div className={styles.barLabel}>{point.score}</div>
                                        <div className={styles.barDate}>
                                            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Competency Breakdown */}
            {analytics.competencyBreakdown.length > 0 && (
                <div className={styles.rubricsCard}>
                    <div className={styles.sectionHeader}>
                        <Target size={20} />
                        <h2 className={styles.sectionTitle}>Detailed Rubric Scores</h2>
                    </div>
                    <div className={styles.competencyList}>
                        {analytics.competencyBreakdown.map((comp, idx) => (
                            <div key={idx} className={styles.competencyItem}>
                                <div className={styles.competencyHeader}>
                                    <span className={styles.competencyName}>{comp.competency}</span>
                                    <div className={styles.competencyScore}>
                                        <span className={styles.scoreValue}>{comp.averageScore}/10</span>
                                        {comp.trend === 'up' && <TrendingUp size={16} className={styles.trendUp} />}
                                        {comp.trend === 'down' && <TrendingDown size={16} className={styles.trendDown} />}
                                        {comp.trend === 'stable' && <span className={styles.trendStable}>—</span>}
                                    </div>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${(comp.averageScore / 10) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
