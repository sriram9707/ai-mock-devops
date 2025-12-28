'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { auth } from '@/auth'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'resumes')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

/**
 * Upload and store resume file securely
 */
export async function uploadResume(file: File): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed')
  }

  // Create upload directory if it doesn't exist
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  // Generate unique filename
  const timestamp = Date.now()
  const userId = session.user.id
  const extension = file.name.split('.').pop()
  const filename = `${userId}-${timestamp}.${extension}`
  const filepath = join(UPLOAD_DIR, filename)

  // Convert File to Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Write file
  await writeFile(filepath, buffer)

  // Return public URL
  return `/uploads/resumes/${filename}`
}

/**
 * Delete resume file
 */
export async function deleteResume(url: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify file belongs to user
  if (!url.includes(session.user.id)) {
    throw new Error('Unauthorized to delete this file')
  }

  const filename = url.split('/').pop()
  if (!filename) return

  const filepath = join(UPLOAD_DIR, filename)
  
  if (existsSync(filepath)) {
    const { unlink } = await import('fs/promises')
    await unlink(filepath)
  }
}

