'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from './prisma'

/**
 * Get current user from Clerk and sync with database
 * Returns user with profile and credits
 */
export async function getSession() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) return null

  // Sync Clerk user with our database
  let dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
    include: { 
      profile: true,
      credits: true,
    }
  })

  // Create user in DB if doesn't exist (first login)
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        image: clerkUser.imageUrl || null,
        emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified' 
          ? new Date() 
          : null,
      },
      include: { 
        profile: true,
        credits: true,
      }
    })

    // Create default user credit on signup
    try {
      await prisma.userCredit.create({
        data: {
          userId: clerkUser.id,
          amount: 3,
        },
      })
      // Refresh to include credits
      dbUser = await prisma.user.findUnique({
        where: { id: clerkUser.id },
        include: { 
          profile: true,
          credits: true,
        }
      })
    } catch (error) {
      console.error('Failed to create user credit:', error)
    }
  } else {
    // Update user info from Clerk if changed
    await prisma.user.update({
      where: { id: clerkUser.id },
      data: {
        email: clerkUser.emailAddresses[0]?.emailAddress || dbUser.email,
        name: clerkUser.fullName || clerkUser.firstName || dbUser.name,
        image: clerkUser.imageUrl || dbUser.image,
        emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified' 
          ? new Date() 
          : dbUser.emailVerified,
      },
    })
  }

  return dbUser
}

/**
 * Get current user ID from Clerk
 */
export async function getUserId(): Promise<string | null> {
  const user = await currentUser()
  return user?.id || null
}
