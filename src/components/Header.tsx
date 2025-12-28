import { auth } from '@/auth'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import UserProfile from './UserProfile'
import Link from 'next/link'
import styles from './Header.module.css'

export default async function Header() {
  const session = await auth()
  const user = session?.user

  let profile = null
  if (user?.id) {
    profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { cvUrl: true },
    })
  }

  if (!user) {
    return null
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoText}>AI Mock Interview</span>
        </Link>

        <nav className={styles.nav}>
          <UserProfile
            user={{
              id: user.id as string,
              name: user.name || null,
              email: user.email || '',
              image: user.image || null,
            }}
            profile={profile}
          />
        </nav>
      </div>
    </header>
  )
}

