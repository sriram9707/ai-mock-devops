'use server'

import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function saveOnboarding(formData: FormData) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    // Parse multi-select fields
    const roles = formData.getAll('roles') as string[]
    const level = formData.get('level') as string
    const skills = formData.getAll('skills') as string[] // "category:skill" format

    // Validate
    if (roles.length === 0 || !level || skills.length === 0) {
        throw new Error('Please fill in all required fields')
    }

    // Handle CV upload (mock for now - in production, upload to S3/Cloudflare R2)
    const cvFile = formData.get('cv') as File | null
    const cvPath = cvFile && cvFile.size > 0 ? `/uploads/${cvFile.name}` : null

    await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            roles: JSON.stringify(roles),
            level: level || 'Entry',
            skills: JSON.stringify(skills),
            cvUrl: cvPath
        },
        update: {
            roles: JSON.stringify(roles),
            level: level,
            skills: JSON.stringify(skills),
            cvUrl: cvPath
        }
    })

    redirect('/dashboard')
}
