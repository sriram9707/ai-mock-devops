'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { auth } from '@/auth'
import { createHash } from 'crypto'

// Store files OUTSIDE public folder for security
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'resumes')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Whitelist of allowed file extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

// MIME type mapping
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Magic bytes (file signatures) for validation
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  '.pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  '.doc': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])], // MS Office
  '.docx': [
    Buffer.from('PK'), // ZIP signature (DOCX is a ZIP file)
  ],
}

/**
 * Validate file extension
 */
function validateExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return ALLOWED_EXTENSIONS.includes(ext)
}

/**
 * Validate file content using magic bytes
 */
function validateFileContent(buffer: Buffer, extension: string): boolean {
  const signatures = FILE_SIGNATURES[extension.toLowerCase()]
  if (!signatures) return false

  return signatures.some(sig => buffer.subarray(0, sig.length).equals(sig))
}

/**
 * Sanitize filename to prevent directory traversal
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100) // Limit length
}

/**
 * Upload and store resume file securely (PRODUCTION VERSION)
 * Files are stored outside public folder and served via authenticated API route
 */
export async function uploadResumeSecure(file: File): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }

  if (file.size === 0) {
    throw new Error('File is empty')
  }

  // Validate file extension
  const originalName = file.name
  if (!validateExtension(originalName)) {
    throw new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed')
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed')
  }

  // Read file content
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Validate file content (magic bytes)
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  if (!validateFileContent(buffer, extension)) {
    throw new Error('File content does not match file type. File may be corrupted or malicious.')
  }

  // Create upload directory if it doesn't exist
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  // Generate secure filename
  const timestamp = Date.now()
  const userId = session.user.id
  const sanitizedExt = sanitizeFilename(extension)
  const fileHash = createHash('md5').update(buffer).digest('hex').substring(0, 8)
  const filename = `${userId}-${timestamp}-${fileHash}${sanitizedExt}`
  const filepath = join(UPLOAD_DIR, filename)

  try {
    // Write file
    await writeFile(filepath, buffer)

    // Return file identifier (not public URL)
    return filename
  } catch (error) {
    console.error('Resume upload error:', error)
    throw new Error('Failed to upload resume. Please try again.')
  }
}

/**
 * Get resume file path (for authenticated API route)
 */
export async function getResumePath(filename: string): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  // Verify file belongs to user
  if (!filename.startsWith(session.user.id)) {
    return null
  }

  const filepath = join(UPLOAD_DIR, filename)
  
  if (!existsSync(filepath)) {
    return null
  }

  return filepath
}

/**
 * Delete resume file
 */
export async function deleteResumeSecure(filename: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify file belongs to user
  if (!filename.startsWith(session.user.id)) {
    throw new Error('Unauthorized to delete this file')
  }

  const filepath = join(UPLOAD_DIR, filename)
  
  if (existsSync(filepath)) {
    try {
      const { unlink } = await import('fs/promises')
      await unlink(filepath)
    } catch (error) {
      console.error('Resume deletion error:', error)
      throw new Error('Failed to delete resume')
    }
  }
}

