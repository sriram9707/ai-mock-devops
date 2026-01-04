
import { startInterview } from '@/lib/interview-start'
import styles from './page.module.css'

export default async function StartInterviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    // id is session_id here

    const startWithJD = startInterview.bind(null, id)
    const skipJD = startInterview.bind(null, id)

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Customize Interview</h1>
                    <p className={styles.subtitle}>
                        Paste the Job Description to tailor the interview to a specific role.
                    </p>
                </header>

                <form action={startWithJD} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <textarea
                            name="jd"
                            className={styles.textarea}
                            placeholder="Paste Job Description here..."
                            rows={10}
                            required
                        />
                    </div>

                    {/* Practice Mode Toggle */}
                    <label className={styles.toggleLabel}>
                        <input
                            type="checkbox"
                            name="isPractice"
                            value="true"
                            className={styles.toggleInput}
                        />
                        <span className={styles.toggleSwitch} />
                        <div className={styles.toggleText}>
                            <span className={styles.toggleTitle}>Enable Practice Mode</span>
                            <span className={styles.toggleDesc}>
                                No scoring, unstressed environment. Restart anytime.
                            </span>
                        </div>
                    </label>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.primaryButton}>
                            Use JD & Start
                        </button>

                        {/* We use a separate form submission or just a button that submits empty JD for skip */}
                        <button
                            type="submit"
                            formAction={skipJD}
                            className={styles.secondaryButton}
                            formNoValidate
                        >
                            Skip (Generic Interview)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
