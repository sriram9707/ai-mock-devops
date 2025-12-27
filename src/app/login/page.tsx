import { login } from '@/lib/auth'
import styles from './page.module.css'

export default function LoginPage() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Enter your email to sign in or create an account</p>

                <form action={login} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="you@example.com"
                            required
                            className={styles.input}
                        />
                    </div>
                    <button type="submit" className={styles.button}>
                        Continue with Email
                    </button>
                </form>
            </div>
        </div>
    )
}
