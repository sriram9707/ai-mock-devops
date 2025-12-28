'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Mail, Chrome } from 'lucide-react'
import styles from './page.module.css'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGoogleSignIn = async () => {
        setIsLoading(true)
        setError('')
        try {
            await signIn('google', { callbackUrl: '/onboarding' })
        } catch (err) {
            setError('Failed to sign in with Google. Please try again.')
            setIsLoading(false)
        }
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            setError('Please enter your email address')
            return
        }
        
        setIsLoading(true)
        setError('')
        try {
            // For email, we'll use a magic link or redirect to onboarding
            // For now, just show message that OAuth is preferred
            setError('Please use Google Sign In for the best experience')
            setIsLoading(false)
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome to AI Mock Interview</h1>
                    <p className={styles.subtitle}>
                        Sign in to start practicing with AI-powered interviews
                    </p>
                </div>

                <div className={styles.form}>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className={`${styles.button} ${styles.googleButton}`}
                    >
                        <Chrome size={20} />
                        <span>Continue with Google</span>
                    </button>

                    <div className={styles.divider}>
                        <span>or</span>
                    </div>

                    <form onSubmit={handleEmailSubmit} className={styles.emailForm}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={styles.input}
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`${styles.button} ${styles.emailButton}`}
                        >
                            <Mail size={20} />
                            <span>{isLoading ? 'Signing in...' : 'Continue with Email'}</span>
                        </button>
                    </form>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <p className={styles.footer}>
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    )
}
