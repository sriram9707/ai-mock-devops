'use client'

import { SignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import styles from '../../login/page.module.css'

export default function SignUpPage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      router.push('/onboarding')
    }
  }, [isSignedIn, router])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Join AI Mock Interview</h1>
          <p className={styles.subtitle}>
            Create your account to start practicing with AI-powered interviews
          </p>
        </div>
        <div className={styles.clerkWrapper}>
          <SignUp
            appearance={{
              elements: {
                rootBox: styles.clerkRoot,
                card: styles.clerkCard,
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/login"
            afterSignUpUrl="/onboarding"
            afterSignInUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  )
}

