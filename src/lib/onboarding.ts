'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
// Use cloud storage for Replit (ephemeral filesystem)
// For local development, use: import { uploadResume } from '@/lib/resume-upload-secure'
import { uploadResumeCloud } from '@/lib/resume-upload-cloud'
import { redirect } from 'next/navigation'

export async function saveOnboarding(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Parse multi-select fields
    const roles = formData.getAll('roles') as string[]
    const level = formData.get('level') as string
    const skills = formData.getAll('skills') as string[] // "category:skill" format

    // Validate
    if (roles.length === 0 || !level || skills.length === 0) {
        throw new Error('Please fill in all required fields')
    }

    // Handle CV upload
    let cvUrl: string | null = null
    const cvFile = formData.get('cv') as File | null
    
    if (cvFile && cvFile.size > 0) {
        try {
            // Use cloud storage (required for Replit)
            cvUrl = await uploadResumeCloud(cvFile)
        } catch (error) {
            console.error('Resume upload error:', error)
            throw new Error(error instanceof Error ? error.message : 'Failed to upload resume')
        }
    }

    // Get existing profile to preserve cvUrl if not uploading new one
    const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
        select: { cvUrl: true },
    })

    await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        create: {
            userId: session.user.id,
            roles: JSON.stringify(roles),
            level: level || 'Entry',
            skills: JSON.stringify(skills),
            cvUrl: cvUrl || null
        },
        update: {
            roles: JSON.stringify(roles),
            level: level,
            skills: JSON.stringify(skills),
            cvUrl: cvUrl || existingProfile?.cvUrl || null
        }
    })

    redirect('/dashboard')
}
