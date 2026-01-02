import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Users, TrendingUp, BarChart3, DollarSign, Clock, Award } from 'lucide-react'
import styles from './page.module.css'
import { isAdminEmail } from '@/lib/admin'

export default async function AdminDashboard() {
    const user = await getSession()
    
    if (!user) {
        redirect('/login')
    }

    // Check if user is admin
    if (!isAdminEmail(user.email)) {
        redirect('/dashboard')
    }

    // Fetch analytics data
    const [
        totalUsers,
        activeUsers,
        totalSessions,
        completedSessions,
        totalOrders,
        totalRevenue,
        packStats,
        recentUsers
    ] = await Promise.all([
        // Total users
        prisma.user.count(),
        
        // Active users (completed at least one interview)
        prisma.user.count({
            where: {
                interviewSessions: {
                    some: {
                        status: 'COMPLETED'
                    }
                }
            }
        }),
        
        // Total sessions
        prisma.interviewSession.count(),
        
        // Completed sessions
        prisma.interviewSession.count({
            where: { status: 'COMPLETED' }
        }),
        
        // Total orders
        prisma.order.count(),
        
        // Total revenue
        prisma.order.aggregate({
            _sum: { amount: true }
        }),
        
        // Pack statistics
        prisma.interviewPack.findMany({
            include: {
                _count: {
                    select: {
                        sessions: true,
                        orders: true
                    }
                }
            },
            orderBy: {
                sessions: {
                    _count: 'desc'
                }
            }
        }),
        
        // Recent users (last 7 days)
        prisma.user.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                profile: true,
                _count: {
                    select: {
                        interviewSessions: true
                    }
                }
            }
        })
    ])

    const revenue = totalRevenue._sum.amount || 0
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Admin Dashboard</h1>
                <p className={styles.subtitle}>Business Analytics & User Insights</p>
            </header>

            {/* Key Metrics */}
            <section className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricIcon}>
                        <Users size={24} />
                    </div>
                    <div className={styles.metricContent}>
                        <h3 className={styles.metricLabel}>Total Users</h3>
                        <p className={styles.metricValue}>{totalUsers}</p>
                        <p className={styles.metricChange}>
                            {activeUsers} active ({Math.round((activeUsers / totalUsers) * 100)}%)
                        </p>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon}>
                        <BarChart3 size={24} />
                    </div>
                    <div className={styles.metricContent}>
                        <h3 className={styles.metricLabel}>Interviews</h3>
                        <p className={styles.metricValue}>{totalSessions}</p>
                        <p className={styles.metricChange}>
                            {completedSessions} completed ({Math.round(completionRate)}%)
                        </p>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon}>
                        <DollarSign size={24} />
                    </div>
                    <div className={styles.metricContent}>
                        <h3 className={styles.metricLabel}>Revenue</h3>
                        <p className={styles.metricValue}>${revenue.toFixed(2)}</p>
                        <p className={styles.metricChange}>
                            {totalOrders} orders
                        </p>
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricIcon}>
                        <TrendingUp size={24} />
                    </div>
                    <div className={styles.metricContent}>
                        <h3 className={styles.metricLabel}>New Users (7d)</h3>
                        <p className={styles.metricValue}>{recentUsers.length}</p>
                        <p className={styles.metricChange}>
                            Last 7 days
                        </p>
                    </div>
                </div>
            </section>

            {/* Interview Pack Analytics */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Interview Pack Performance</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Pack</th>
                                <th>Role</th>
                                <th>Level</th>
                                <th>Sessions</th>
                                <th>Orders</th>
                                <th>Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packStats.map((pack) => {
                                const completed = pack._count.sessions
                                const total = pack._count.sessions
                                const rate = total > 0 ? (completed / total) * 100 : 0
                                
                                return (
                                    <tr key={pack.id}>
                                        <td className={styles.tableCell}>{pack.title}</td>
                                        <td className={styles.tableCell}>{pack.role}</td>
                                        <td className={styles.tableCell}>{pack.level}</td>
                                        <td className={styles.tableCell}>{pack._count.sessions}</td>
                                        <td className={styles.tableCell}>{pack._count.orders}</td>
                                        <td className={styles.tableCell}>
                                            <span className={rate >= 70 ? styles.good : rate >= 50 ? styles.warning : styles.bad}>
                                                {Math.round(rate)}%
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Recent Users */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Recent Users (Last 7 Days)</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Name</th>
                                <th>Level</th>
                                <th>Interviews</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={styles.tableCell}>No new users in the last 7 days</td>
                                </tr>
                            ) : (
                                recentUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td className={styles.tableCell}>{user.email}</td>
                                        <td className={styles.tableCell}>{user.name || 'N/A'}</td>
                                        <td className={styles.tableCell}>{user.profile?.level || 'N/A'}</td>
                                        <td className={styles.tableCell}>{user._count.interviewSessions}</td>
                                        <td className={styles.tableCell}>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    )
}

