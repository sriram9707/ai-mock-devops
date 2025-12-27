import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import styles from './page.module.css'
import { Award, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function CertificatePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    const certificate = await prisma.certificate.findUnique({
        where: { shareToken: token },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            },
            session: {
                include: {
                    pack: true
                }
            }
        }
    })

    if (!certificate) {
        notFound()
    }

    const { user, session } = certificate

    return (
        <div className={styles.container}>
            <div className={styles.certificateCard}>
                <div className={styles.certificateHeader}>
                    <div className={styles.certificateIcon}>
                        <Award size={48} />
                    </div>
                    <h1 className={styles.certificateTitle}>Certificate of Achievement</h1>
                    <p className={styles.certificateSubtitle}>This certifies that</p>
                </div>

                <div className={styles.certificateBody}>
                    <div className={styles.userName}>{user.name || user.email}</div>
                    <div className={styles.achievement}>
                        has successfully completed the
                    </div>
                    <div className={styles.certificateName}>{certificate.title}</div>
                    <div className={styles.scoreSection}>
                        <div className={styles.scoreLabel}>Final Score</div>
                        <div className={styles.scoreValue}>{certificate.score.toFixed(1)} / 100</div>
                    </div>
                </div>

                <div className={styles.certificateFooter}>
                    <div className={styles.footerInfo}>
                        <div className={styles.infoItem}>
                            <Calendar size={16} />
                            <span>Issued: {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <TrendingUp size={16} />
                            <span>Interview Pack: {session.pack.title}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href="/dashboard" className={styles.button}>
                        Start Your Own Interview
                    </Link>
                </div>
            </div>
        </div>
    )
}

