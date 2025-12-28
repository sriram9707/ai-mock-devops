'use client'

import { useState, useRef, useEffect } from 'react'
import { User, FileText, LogOut, ChevronDown } from 'lucide-react'
import { signOut } from 'next-auth/react'
import styles from './UserProfile.module.css'

interface UserProfileProps {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  profile?: {
    cvUrl?: string | null
  } | null
}

export default function UserProfile({ user, profile }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const displayName = user.name || user.email.split('@')[0]
  const initials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={displayName}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {initials}
          </div>
        )}
        <span className={styles.name}>{displayName}</span>
        <ChevronDown className={styles.chevron} size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              {user.image ? (
                <img
                  src={user.image}
                  alt={displayName}
                  className={styles.dropdownAvatar}
                />
              ) : (
                <div className={styles.dropdownAvatarPlaceholder}>
                  {initials}
                </div>
              )}
              <div>
                <div className={styles.userName}>{user.name || 'User'}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.menu}>
            {profile?.cvUrl && (
              <a
                href={profile.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.menuItem}
                onClick={() => setIsOpen(false)}
              >
                <FileText size={18} />
                <span>View Resume</span>
              </a>
            )}

            <button
              className={styles.menuItem}
              onClick={handleSignOut}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

