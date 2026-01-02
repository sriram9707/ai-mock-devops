'use client'

import { SignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import styles from '../../login/page.module.css'

export default function LoginPage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard')
    }
  }, [isSignedIn, router])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to AI Mock Interview</h1>
          <p className={styles.subtitle}>
            Sign in to start practicing with AI-powered interviews
          </p>
        </div>
        <div className={styles.clerkWrapper}>
          <SignIn
            appearance={{
              elements: {
                rootBox: styles.clerkRoot,
                card: styles.clerkCard,
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/onboarding"
          />
        </div>
      </div>
    </div>
  )
}

