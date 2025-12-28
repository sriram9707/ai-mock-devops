'use server'

import { auth } from '@/auth'
import prisma from './prisma'

/**
 * Get current session user (compatible with existing code)
 * @deprecated Use auth() from @/auth directly for new code
 */
export async function getSession() {
    const session = await auth()
    
    if (!session?.user?.id) return null

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { 
            profile: true,
            credits: true,
        }
    })

    return user
}
