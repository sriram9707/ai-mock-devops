'use client'

import { ClerkProvider } from '@clerk/nextjs'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/login"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/onboarding"
    >
      {children}
    </ClerkProvider>
  )
}
