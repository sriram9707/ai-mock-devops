'use server'

import { currentUser } from '@clerk/nextjs/server'
import { createHash } from 'crypto'

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
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100)
}

/**
 * Upload to Cloudflare R2 (S3-compatible)
 */
async function uploadToR2(file: File, buffer: Buffer, userId: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('R2 credentials not configured')
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  const timestamp = Date.now()
  const fileHash = createHash('md5').update(buffer).digest('hex').substring(0, 8)
  const extension = file.name.substring(file.name.lastIndexOf('.'))
  const sanitizedExt = sanitizeFilename(extension)
  const filename = `resumes/${userId}-${timestamp}-${fileHash}${sanitizedExt}`

  const contentType = file.type || 'application/octet-stream'

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
      // Make file private (only accessible via signed URL or API)
      // Or make public if R2_PUBLIC_URL is set
    })
  )

  // Return public URL or API route
  if (publicUrl) {
    return `${publicUrl}/${filename}`
  }
  
  // Return identifier for API route
  return filename
}

/**
 * Upload to Vercel Blob
 */
async function uploadToVercelBlob(file: File, buffer: Buffer, userId: string): Promise<string> {
  const { put } = await import('@vercel/blob')
  
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error('Vercel Blob token not configured')
  }

  const timestamp = Date.now()
  const fileHash = createHash('md5').update(buffer).digest('hex').substring(0, 8)
  const extension = file.name.substring(file.name.lastIndexOf('.'))
  const sanitizedExt = sanitizeFilename(extension)
  const filename = `${userId}-${timestamp}-${fileHash}${sanitizedExt}`

  const blob = await put(filename, buffer, {
    access: 'public', // Or 'private' with signed URLs
    token,
    contentType: file.type,
  })

  return blob.url
}

/**
 * Upload and store resume file to cloud storage (REPLIT VERSION)
 * Supports Cloudflare R2 and Vercel Blob
 */
export async function uploadResumeCloud(file: File): Promise<string> {
  const user = await currentUser()
  if (!user?.id) {
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

  try {
    // Try R2 first, then Vercel Blob, then fallback to error
    if (process.env.R2_ACCOUNT_ID) {
      return await uploadToR2(file, buffer, user.id)
    } else if (process.env.BLOB_READ_WRITE_TOKEN) {
      return await uploadToVercelBlob(file, buffer, user.id)
    } else {
      throw new Error(
        'No cloud storage configured. Please set R2_ACCOUNT_ID or BLOB_READ_WRITE_TOKEN in Replit Secrets.'
      )
    }
  } catch (error) {
    console.error('Resume upload error:', error)
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to upload resume. Please try again.'
    )
  }
}

/**
 * Delete resume from cloud storage
 */
export async function deleteResumeCloud(url: string): Promise<void> {
  const user = await currentUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify file belongs to user (check URL contains user ID)
  if (!url.includes(user.id)) {
    throw new Error('Unauthorized to delete this file')
  }

  try {
    // Delete from R2
    if (process.env.R2_ACCOUNT_ID && url.includes('r2.dev')) {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')
      const accountId = process.env.R2_ACCOUNT_ID
      const accessKeyId = process.env.R2_ACCESS_KEY_ID
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
      const bucketName = process.env.R2_BUCKET_NAME

      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })

      // Extract key from URL
      const key = url.split('/').slice(-2).join('/') // Get 'resumes/filename'

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      )
    }
    // Delete from Vercel Blob
    else if (process.env.BLOB_READ_WRITE_TOKEN && url.includes('blob.vercel-storage.com')) {
      const { del } = await import('@vercel/blob')
      const token = process.env.BLOB_READ_WRITE_TOKEN
      
      // Extract filename from URL
      const filename = url.split('/').pop()
      if (filename) {
        await del(filename, { token })
      }
    }
  } catch (error) {
    console.error('Resume deletion error:', error)
    throw new Error('Failed to delete resume')
  }
}

