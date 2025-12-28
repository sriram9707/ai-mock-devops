import { NextRequest, NextResponse } from 'next/server'
import { getResumePath } from '@/lib/resume-upload-secure'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

/**
 * Authenticated resume download endpoint
 * Files are stored outside public folder and served only to authenticated users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename

    // Get file path (validates ownership)
    const filepath = await getResumePath(filename)
    
    if (!filepath || !existsSync(filepath)) {
      return NextResponse.json(
        { error: 'File not found or unauthorized' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(filepath)
    
    // Determine content type
    const contentType = filename.endsWith('.pdf')
      ? 'application/pdf'
      : filename.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/msword'

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Resume download error:', error)
    return NextResponse.json(
      { error: 'Failed to download resume' },
      { status: 500 }
    )
  }
}

