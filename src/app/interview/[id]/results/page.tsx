import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import { CheckCircle, AlertCircle, BookOpen, Share2, Linkedin, Copy, Target } from 'lucide-react'
import { CertificateShare } from '@/components/CertificateShare'
import { FeedbackForm } from '@/components/FeedbackForm'

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await getSession()

    if (!user) {
        redirect('/login')
    }

    const session = await prisma.interviewSession.findUnique({
        where: { id },
        include: {
            pack: true,
            result: true,
            certificate: true
        }
    })

    if (!session || session.userId !== user.id) {
        notFound()
    }

    const { result, pack, certificate } = session

    // Practice mode: show different UI
    if (session.isPractice) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <header className={styles.header}>
                        <h1>Practice Session Complete</h1>
                        <p className={styles.subtitle}>
                            Great job completing your practice interview for <strong>{pack.title}</strong>!
                        </p>
                    </header>

                    <div className={styles.practiceMessage}>
                        <div className={styles.practiceIcon}>
                            <BookOpen size={48} />
                        </div>
                        <h2>Practice Mode</h2>
                        <p>
                            This was a practice session, so no scoring was performed.
                            Use practice mode to familiarize yourself with the interview format
                            and get comfortable with the questions.
                        </p>
                        <div className={styles.practiceActions}>
                            <Link href={`/interview/${id}/start`} className={styles.practiceButton}>
                                Practice Again
                            </Link>
                            <Link href="/dashboard" className={styles.secondaryButton}>
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Real interview: require result
    if (!result) {
        // If status is completed but result missing, it's generating
        if (session.status === 'COMPLETED' || session.status === 'IN_PROGRESS') {
            return (
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.loadingWrapper}>
                            <div className={styles.spinner}></div>
                            <h2>Generating Your Report...</h2>
                            <p>Alex is analyzing your interview feedback.</p>
                            <p className={styles.subtext}>This usually takes 10-20 seconds.</p>
                            <meta httpEquiv="refresh" content="3" />
                        </div>
                    </div>
                </div>
            )
        }
        notFound()
    }

    // Parse JSON fields
    const strengths = JSON.parse(result.strengths) as string[]
    const improvements = JSON.parse(result.improvements) as string[]
    const recommendations = JSON.parse(result.upskillingPlan) as { weeks: number, focus_areas: string[] }
    const competencyScoresRaw = JSON.parse(result.competencyScores) as Record<string, number | { toolMastery: string, automation: string, impact: string, communication: string }>

    // Extract seniority gap if present
    const seniorityGap = competencyScoresRaw._seniorityGap as { toolMastery: 'medior' | 'senior' | 'borderline', automation: 'medior' | 'senior' | 'borderline', impact: 'medior' | 'senior' | 'borderline', communication: 'medior' | 'senior' | 'borderline' } | undefined

    // Filter out metadata from competency scores
    const competencyScores = Object.fromEntries(
        Object.entries(competencyScoresRaw).filter(([key]) => key !== '_seniorityGap')
    ) as Record<string, number>

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <header className={styles.header}>
                    <h1>Interview Results</h1>
                    <p className={styles.subtitle}>
                        Here is how you performed in your <strong>{pack.title}</strong> interview.
                    </p>
                </header>

                <div className={styles.scoreSection}>
                    <div className={styles.scoreCircle}>
                        <span className={styles.scoreValue}>{result.overallScore}</span>
                        <span className={styles.scoreLabel}>/ 100</span>
                    </div>
                    <div className={styles.scoreMessage}>
                        {result.overallScore >= 80 ? (
                            <h2 className={styles.excellent}>Excellent!</h2>
                        ) : result.overallScore >= 60 ? (
                            <h2 className={styles.good}>Good Job</h2>
                        ) : (
                            <h2 className={styles.needsImprovement}>Needs Improvement</h2>
                        )}
                        <p>You have completed the mock interview.</p>
                    </div>
                </div>

                {/* Seniority Gap Scorecard */}
                {seniorityGap && (
                    <div className={styles.rubricSection}>
                        <div className={styles.sectionHeader}>
                            <Target className={styles.icon} />
                            <h3>Seniority Gap Analysis</h3>
                        </div>
                        <div className={styles.seniorityTable}>
                            <table className={styles.gapTable}>
                                <thead>
                                    <tr>
                                        <th>Competency</th>
                                        <th>Medior Level</th>
                                        <th>Senior Level</th>
                                        <th>Your Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Tool Mastery</strong></td>
                                        <td>Knows CLI/Syntax</td>
                                        <td>Knows Internals & Limits</td>
                                        <td className={styles[seniorityGap.toolMastery]}>{seniorityGap.toolMastery.charAt(0).toUpperCase() + seniorityGap.toolMastery.slice(1)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Automation</strong></td>
                                        <td>Writes Scripts</td>
                                        <td>Builds Platforms (IDPs)</td>
                                        <td className={styles[seniorityGap.automation]}>{seniorityGap.automation.charAt(0).toUpperCase() + seniorityGap.automation.slice(1)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Impact</strong></td>
                                        <td>Solves the Ticket</td>
                                        <td>Improves DORA Metrics</td>
                                        <td className={styles[seniorityGap.impact]}>{seniorityGap.impact.charAt(0).toUpperCase() + seniorityGap.impact.slice(1)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Communication</strong></td>
                                        <td>Explains the "How"</td>
                                        <td>Translates to "Business Value"</td>
                                        <td className={styles[seniorityGap.communication]}>{seniorityGap.communication.charAt(0).toUpperCase() + seniorityGap.communication.slice(1)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Rubric Scores */}
                <div className={styles.rubricSection}>
                    <div className={styles.sectionHeader}>
                        <Target className={styles.icon} />
                        <h3>Detailed Rubric Scores</h3>
                    </div>
                    <div className={styles.rubricGrid}>
                        {Object.entries(competencyScores).map(([competency, score]) => (
                            <div key={competency} className={styles.rubricItem}>
                                <div className={styles.rubricHeader}>
                                    <span className={styles.rubricName}>{competency}</span>
                                    <span className={styles.rubricScore}>{score.toFixed(1)} / 10</span>
                                </div>
                                <div className={styles.rubricBar}>
                                    <div
                                        className={styles.rubricFill}
                                        style={{ width: `${(score / 10) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.feedbackSection}>
                    <div className={styles.sectionHeader}>
                        <CheckCircle className={styles.icon} />
                        <h3>Strengths</h3>
                    </div>
                    <ul className={styles.list}>
                        {strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>

                {improvements.length > 0 && (
                    <div className={styles.feedbackSection}>
                        <div className={styles.sectionHeader}>
                            <AlertCircle className={styles.icon} />
                            <h3>Areas for Improvement</h3>
                        </div>
                        <ul className={styles.list}>
                            {improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                    </div>
                )}

                <div className={styles.feedbackSection}>
                    <p className={styles.feedbackText}>{result.feedback}</p>
                </div>

                <div className={styles.recommendationsSection}>
                    <div className={styles.sectionHeader}>
                        <BookOpen className={styles.icon} />
                        <h3>Upskilling Plan ({recommendations.weeks} Weeks)</h3>
                    </div>
                    <ul className={styles.list}>
                        {recommendations.focus_areas.map((area, i) => <li key={i}>{area}</li>)}
                    </ul>
                </div>

                {certificate && (
                    <div className={styles.shareSection}>
                        <CertificateShare
                            certificateId={certificate.id}
                            shareToken={certificate.shareToken}
                            certificateTitle={certificate.title}
                            score={certificate.score}
                        />
                    </div>
                )}

                <FeedbackForm sessionId={id} />

                <div className={styles.actions}>
                    <Link href="/dashboard" className={styles.button}>
                        Back to Dashboard
                    </Link>
                    <Link href={`/interview/${pack.id}/purchase`} className={`${styles.button} ${styles.secondary}`}>
                        Try Again
                    </Link>
                    <Link href="/feedback-summary" className={`${styles.button} ${styles.secondary}`}>
                        Feedback Summary
                    </Link>
                </div>
            </div>
        </div>
    )
}
