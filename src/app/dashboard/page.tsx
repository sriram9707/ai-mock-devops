import Link from 'next/link'
import styles from './page.module.css'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ArrowUpRight, BarChart3, Trophy } from 'lucide-react'

export default async function Dashboard() {
    const user = await getSession()
    if (!user || !user.profile) {
        redirect('/onboarding')
    }

    const packs = await prisma.interviewPack.findMany({
        orderBy: { title: 'asc' }
    })

    const orders = await prisma.order.findMany({
        where: { userId: user.id, status: 'PURCHASED' }
    })

    // Helper to find active order for a pack
    const getOrder = (packId: string) => orders.find(o => o.packId === packId && o.attemptsUsed < o.attemptsTotal)

    // Server Actions need to be imported or passed via form
    // Since we are in a server component, we can use forms with server actions
    // BUT specific imports for actions in client/server mix can be tricky. 
    // Let's use a simpler Client Component wrapper/buttons if needed, 
    // OR just simple form actions since this is a Server Component.

    // We need to import the actions.
    const { startNewAttempt, purchaseInterview } = await import('@/lib/interview')

    return (
        <main className={styles.container}>
            {/* Editorial Header */}
            <header className={`${styles.hero} animate-reveal`}>
                <h1 className={styles.title}>
                    Master the <span className="serif-italic">Senior</span> <br />
                    Engineering Interview.
                </h1>
                <p className={styles.subtitle}>
                    Practice live with AI Personas calibrated to Top-Tier Tech companies.
                    Get instant feedback on your architecture, communication, and code.
                </p>
                <div className={styles.headerActions}>
                    <Link href="/analytics" className={styles.navButton}>
                        <BarChart3 size={18} />
                        Analytics
                    </Link>
                    <Link href="/leaderboard" className={styles.navButton}>
                        <Trophy size={18} />
                        Leaderboard
                    </Link>
                </div>
            </header>

            {/* Swiss Grid */}
            <section className={styles.grid}>
                {packs.map((pack, i) => {
                    const order = getOrder(pack.id)
                    const attemptsLeft = order ? order.attemptsTotal - order.attemptsUsed : 0

                    return (
                        <div
                            key={pack.id}
                            className={`${styles.card} equity-card`}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.index}>0{i + 1}</span>
                                <span className={styles.roleTag}>{pack.role}</span>
                            </div>

                            <div className={styles.cardBody}>
                                <h3 className={styles.cardTitle}>{pack.title}</h3>
                                <p className={styles.meta}>
                                    {pack.durationMinutes} MINS — {pack.level.toUpperCase()}
                                </p>
                                {order && (
                                    <div className={styles.attemptsBadge}>
                                        {attemptsLeft} Attempts Remaining
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardFooter}>
                                {order ? (
                                    <form action={async () => {
                                        'use server'
                                        await startNewAttempt(pack.id)
                                    }}>
                                        <button type="submit" className={styles.actionButton}>
                                            Start Attempt
                                            <ArrowUpRight className="btn-arrow" size={24} />
                                        </button>
                                    </form>
                                ) : (
                                    <form action={async () => {
                                        'use server'
                                        await purchaseInterview(pack.id)
                                    }}>
                                        <button type="submit" className={styles.actionButton}>
                                            Purchase
                                            <ArrowUpRight className="btn-arrow" size={24} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )
                })}
            </section>
        </main>
    )
}
