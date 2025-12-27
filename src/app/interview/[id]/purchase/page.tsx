import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { purchaseInterview } from '@/lib/interview'
import { notFound, redirect } from 'next/navigation'
import styles from './page.module.css'

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await getSession()

    if (!user) {
        redirect('/login')
    }

    const pack = await prisma.interviewPack.findUnique({
        where: { id },
    })

    if (!pack) {
        notFound()
    }

    const purchaseAction = purchaseInterview.bind(null, pack.id)

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>Order Summary</h1>
                    <p>You are about to purchase a mock interview pack.</p>
                </div>

                <div className={styles.details}>
                    <div className={styles.row}>
                        <span>Interview Pack</span>
                        <span className={styles.value}>{pack.title}</span>
                    </div>
                    <div className={styles.row}>
                        <span>Role</span>
                        <span className={styles.value}>{pack.role}</span>
                    </div>
                    <div className={styles.row}>
                        <span>Level</span>
                        <span className={styles.value}>{pack.level}</span>
                    </div>
                    <div className={styles.row}>
                        <span>Duration</span>
                        <span className={styles.value}>{pack.durationMinutes} min</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={`${styles.row} ${styles.total}`}>
                        <span>Total</span>
                        <span>${pack.price}</span>
                    </div>
                </div>

                <form action={purchaseAction}>
                    <button type="submit" className={styles.button}>
                        Complete Purchase
                    </button>
                </form>

                <p className={styles.disclaimer}>
                    By clicking &quot;Complete Purchase&quot;, you agree to our terms of service.
                    This is a mock payment, no actual charge will be made.
                </p>
            </div>
        </div>
    )
}
