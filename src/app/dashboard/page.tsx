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

    // MVP 0.1: Only show DevOps Entry, Senior, and SRE packs
    // Others will be shown as "Coming Soon"
    const allPacks = await prisma.interviewPack.findMany({
        orderBy: { title: 'asc' }
    })
    
    // Active packs (DevOps Entry, Senior, SRE)
    const activePacks = allPacks.filter(pack => {
        const role = pack.role.toLowerCase()
        const level = pack.level.toLowerCase()
        return (
            (role.includes('devops') && (level.includes('entry') || level.includes('senior'))) ||
            role.includes('sre')
        )
    })
    
    // Coming soon packs (all others)
    const comingSoonPacks = allPacks.filter(pack => {
        const role = pack.role.toLowerCase()
        const level = pack.level.toLowerCase()
        return !(
            (role.includes('devops') && (level.includes('entry') || level.includes('senior'))) ||
            role.includes('sre')
        )
    })
    
    const packs = [...activePacks, ...comingSoonPacks]

    const orders = await prisma.order.findMany({
        where: { userId: user.id, status: 'PURCHASED' }
    })

    // Helper to find active order for a pack (with attempts remaining)
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
                </div>
            </header>

            {/* Swiss Grid */}
            <section className={styles.grid}>
                {packs.map((pack, i) => {
                    const order = getOrder(pack.id)
                    // Cap attempts at 2 (even if old orders have more)
                    const attemptsLeft = order ? Math.min(2, order.attemptsTotal - order.attemptsUsed) : 0
                    
                    // Check if pack is coming soon
                    const role = pack.role.toLowerCase()
                    const level = pack.level.toLowerCase()
                    const isComingSoon = !(
                        (role.includes('devops') && (level.includes('entry') || level.includes('senior'))) ||
                        role.includes('sre')
                    )

                    return (
                        <div
                            key={pack.id}
                            className={`${styles.card} equity-card ${isComingSoon ? styles.comingSoon : ''}`}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.index}>0{i + 1}</span>
                                <span className={styles.roleTag}>{pack.role}</span>
                                {isComingSoon && (
                                    <span className={styles.comingSoonBadge}>Coming Soon</span>
                                )}
                            </div>

                            <div className={styles.cardBody}>
                                <h3 className={styles.cardTitle}>{pack.title}</h3>
                                <p className={styles.meta}>
                                    {pack.durationMinutes} MINS — {pack.level.toUpperCase()}
                                </p>
                                {!isComingSoon && order && (
                                    <div className={styles.attemptsBadge}>
                                        {attemptsLeft} Attempts Remaining
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardFooter}>
                                {isComingSoon ? (
                                    <button 
                                        type="button" 
                                        className={`${styles.actionButton} ${styles.disabled}`}
                                        disabled
                                    >
                                        Coming Soon
                                    </button>
                                ) : order ? (
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
