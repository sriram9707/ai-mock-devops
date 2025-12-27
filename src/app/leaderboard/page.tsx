import { getLeaderboard } from '@/lib/leaderboard'
import styles from './page.module.css'
import { Trophy, Medal, Award, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function LeaderboardPage() {
    const leaderboard = await getLeaderboard()

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy size={24} className={styles.gold} />
        if (rank === 2) return <Medal size={24} className={styles.silver} />
        if (rank === 3) return <Medal size={24} className={styles.bronze} />
        return <span className={styles.rankNumber}>{rank}</span>
    }

    const getRankClass = (rank: number) => {
        if (rank === 1) return styles.firstPlace
        if (rank === 2) return styles.secondPlace
        if (rank === 3) return styles.thirdPlace
        return ''
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Leaderboard</h1>
                    <p className={styles.subtitle}>See how you stack up against other candidates</p>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/dashboard" className={styles.backButton}>
                        ← Dashboard
                    </Link>
                    <Link href="/analytics" className={styles.analyticsButton}>
                        My Analytics →
                    </Link>
                </div>
            </header>

            {/* Top Performers */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Trophy size={24} className={styles.sectionIcon} />
                    <h2 className={styles.sectionTitle}>Top Performers</h2>
                </div>
                <div className={styles.leaderboardTable}>
                    <div className={styles.tableHeader}>
                        <div className={styles.headerCell}>Rank</div>
                        <div className={styles.headerCell}>Name</div>
                        <div className={styles.headerCell}>Avg Score</div>
                        <div className={styles.headerCell}>Sessions</div>
                        <div className={styles.headerCell}>Certificates</div>
                        <div className={styles.headerCell}>Best Score</div>
                    </div>
                    {leaderboard.topPerformers.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No completed interviews yet. Be the first!</p>
                        </div>
                    ) : (
                        leaderboard.topPerformers.map((entry) => (
                            <div 
                                key={entry.userId} 
                                className={`${styles.tableRow} ${getRankClass(entry.rank)}`}
                            >
                                <div className={styles.rankCell}>
                                    {getRankIcon(entry.rank)}
                                </div>
                                <div className={styles.nameCell}>
                                    <div className={styles.name}>{entry.userName || 'Anonymous'}</div>
                                    <div className={styles.email}>{entry.userEmail}</div>
                                </div>
                                <div className={styles.scoreCell}>
                                    <span className={styles.scoreValue}>{entry.averageScore.toFixed(1)}</span>
                                </div>
                                <div className={styles.sessionsCell}>{entry.totalSessions}</div>
                                <div className={styles.certificatesCell}>
                                    {entry.certificatesEarned > 0 && (
                                        <Award size={16} className={styles.certIcon} />
                                    )}
                                    {entry.certificatesEarned}
                                </div>
                                <div className={styles.bestScoreCell}>
                                    <span className={styles.bestScore}>{entry.bestScore.toFixed(1)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Recent Completions */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Calendar size={24} className={styles.sectionIcon} />
                    <h2 className={styles.sectionTitle}>Recent Completions</h2>
                </div>
                <div className={styles.leaderboardTable}>
                    <div className={styles.tableHeader}>
                        <div className={styles.headerCell}>Rank</div>
                        <div className={styles.headerCell}>Name</div>
                        <div className={styles.headerCell}>Avg Score</div>
                        <div className={styles.headerCell}>Sessions</div>
                        <div className={styles.headerCell}>Certificates</div>
                        <div className={styles.headerCell}>Last Activity</div>
                    </div>
                    {leaderboard.recentCompletions.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No recent activity yet.</p>
                        </div>
                    ) : (
                        leaderboard.recentCompletions.map((entry) => (
                            <div 
                                key={entry.userId} 
                                className={styles.tableRow}
                            >
                                <div className={styles.rankCell}>
                                    <span className={styles.rankNumber}>{entry.rank}</span>
                                </div>
                                <div className={styles.nameCell}>
                                    <div className={styles.name}>{entry.userName || 'Anonymous'}</div>
                                    <div className={styles.email}>{entry.userEmail}</div>
                                </div>
                                <div className={styles.scoreCell}>
                                    <span className={styles.scoreValue}>{entry.averageScore.toFixed(1)}</span>
                                </div>
                                <div className={styles.sessionsCell}>{entry.totalSessions}</div>
                                <div className={styles.certificatesCell}>
                                    {entry.certificatesEarned > 0 && (
                                        <Award size={16} className={styles.certIcon} />
                                    )}
                                    {entry.certificatesEarned}
                                </div>
                                <div className={styles.dateCell}>
                                    {new Date(entry.recentActivity).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}

