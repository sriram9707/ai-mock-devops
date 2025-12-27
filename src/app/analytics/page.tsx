import { getSession } from '@/lib/auth'
import { getUserAnalytics } from '@/lib/analytics'
import { redirect } from 'next/navigation'
import styles from './page.module.css'
import { TrendingUp, TrendingDown, Award, Target, Activity, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default async function AnalyticsPage() {
    const user = await getSession()
    if (!user) {
        redirect('/login')
    }

    const analytics = await getUserAnalytics()

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Analytics Dashboard</h1>
                    <p className={styles.subtitle}>Track your progress and identify areas for improvement</p>
                </div>
                <Link href="/dashboard" className={styles.backButton}>
                    ← Back to Dashboard
                </Link>
            </header>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <BarChart3 size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{analytics.averageScore}</div>
                        <div className={styles.statLabel}>Average Score</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Activity size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{analytics.completedSessions}</div>
                        <div className={styles.statLabel}>Completed Sessions</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Award size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{analytics.certificatesEarned}</div>
                        <div className={styles.statLabel}>Certificates Earned</div>
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
            </div>

            {/* Score Trend Chart */}
            {analytics.scoreTrend.length > 0 && (
                <div className={styles.chartCard}>
                    <h2 className={styles.sectionTitle}>Score Trend</h2>
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
                                        <div className={styles.barDate}>{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Competency Breakdown */}
            {analytics.competencyBreakdown.length > 0 && (
                <div className={styles.competencyCard}>
                    <h2 className={styles.sectionTitle}>Competency Breakdown</h2>
                    <div className={styles.competencyList}>
                        {analytics.competencyBreakdown.map((comp, idx) => (
                            <div key={idx} className={styles.competencyItem}>
                                <div className={styles.competencyHeader}>
                                    <span className={styles.competencyName}>{comp.competency}</span>
                                    <div className={styles.competencyScore}>
                                        <span className={styles.scoreValue}>{comp.averageScore}</span>
                                        {comp.trend === 'up' && <TrendingUp size={16} className={styles.trendUp} />}
                                        {comp.trend === 'down' && <TrendingDown size={16} className={styles.trendDown} />}
                                        {comp.trend === 'stable' && <span className={styles.trendStable}>—</span>}
                                    </div>
                                </div>
                                <div className={styles.progressBar}>
                                    <div 
                                        className={styles.progressFill}
                                        style={{ width: `${comp.averageScore}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Weak & Strong Areas */}
            <div className={styles.areasGrid}>
                {analytics.weakAreas.length > 0 && (
                    <div className={styles.areaCard}>
                        <div className={styles.areaHeader}>
                            <Target size={20} className={styles.weakIcon} />
                            <h3 className={styles.areaTitle}>Areas for Improvement</h3>
                        </div>
                        <ul className={styles.areaList}>
                            {analytics.weakAreas.map((area, idx) => (
                                <li key={idx} className={styles.areaItem}>{area}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {analytics.strongAreas.length > 0 && (
                    <div className={styles.areaCard}>
                        <div className={styles.areaHeader}>
                            <Award size={20} className={styles.strongIcon} />
                            <h3 className={styles.areaTitle}>Strengths</h3>
                        </div>
                        <ul className={styles.areaList}>
                            {analytics.strongAreas.map((area, idx) => (
                                <li key={idx} className={styles.areaItem}>{area}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            {analytics.recentActivity.length > 0 && (
                <div className={styles.activityCard}>
                    <h2 className={styles.sectionTitle}>Recent Activity</h2>
                    <div className={styles.activityList}>
                        {analytics.recentActivity.map((activity, idx) => (
                            <div key={idx} className={styles.activityItem}>
                                <div className={styles.activityDate}>{new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                <div className={styles.activityContent}>
                                    <div className={styles.activityTitle}>{activity.packTitle}</div>
                                    <div className={styles.activityScore}>Score: {activity.score}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

