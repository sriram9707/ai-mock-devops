import { currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import styles from './Header.module.css'

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || []

export default async function Header() {
  let user
  try {
    user = await currentUser()
  } catch (err) {
    console.error('Header: currentUser() failed', err)
    return null
  }

  if (!user) {
    return null
  }

  // Sync Clerk user with our database
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  })

  // Create user in DB if doesn't exist (first login)
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || user.firstName || null,
        image: user.imageUrl || null,
        emailVerified: user.emailAddresses[0]?.verification?.status === 'verified'
          ? new Date()
          : null,
      },
      include: { profile: true },
    })

    // Create default user credit on signup
    try {
      await prisma.userCredit.create({
        data: {
          userId: user.id,
          amount: 3,
        },
      })
    } catch (error) {
      console.error('Failed to create user credit:', error)
    }
  } else {
    // Update user info from Clerk if changed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.emailAddresses[0]?.emailAddress || dbUser.email,
        name: user.fullName || user.firstName || dbUser.name,
        image: user.imageUrl || dbUser.image,
        emailVerified: user.emailAddresses[0]?.verification?.status === 'verified'
          ? new Date()
          : dbUser.emailVerified,
      },
    })
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoText}>AI Mock Interview</span>
        </Link>

        <nav className={styles.nav}>
          {ADMIN_EMAILS.includes(dbUser.email) && (
            <Link href="/admin" className={styles.adminLink}>
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
            afterSignOutUrl="/login"
          />
        </nav>
      </div>
    </header>
  )
}
