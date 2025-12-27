'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from './prisma'

export async function login(formData: FormData) {
    const email = formData.get('email') as string

    if (!email) {
        throw new Error('Email is required')
    }

    let user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        user = await prisma.user.create({
            data: { email },
        })
    }

    // Simple session management using cookies
    const cookieStore = await cookies()
    cookieStore.set('userId', user.id)

    redirect('/dashboard')
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('userId')
    redirect('/')
}

export async function getSession() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) return null

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    })

    return user
}
