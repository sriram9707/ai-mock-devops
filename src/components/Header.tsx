'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import styles from './Header.module.css'
import { isAdminEmail } from '@/lib/admin'

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || []

export default function Header() {
  const { user } = useUser()
  const primaryEmail = user?.primaryEmailAddress?.emailAddress
  const fallbackEmail = user?.emailAddresses?.[0]?.emailAddress
  const email = primaryEmail || fallbackEmail

  const isAdmin = email ? ADMIN_EMAILS.includes(email) : false

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>AI Mock Interview</span>
        </Link>

        <nav className={styles.nav}>
          <SignedOut>
            <Link href="/login" className={styles.navLink}>
              Sign in
            </Link>
            <Link href="/sign-up" className={styles.primaryButton}>
              Get started
            </Link>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" className={styles.navLink}>
                Admin
              </Link>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: styles.clerkAvatar,
                  userButtonPopoverCard: styles.clerkPopover,
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </nav>
      </div>
    </header>
  )
}
