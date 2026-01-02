/**
 * Data Ingestion Script for Qdrant Vector Database
 * 
 * This script loads documents from data/knowledge-base/, splits them into chunks,
 * generates embeddings, and stores them in Qdrant for RAG retrieval.
 * 
 * Usage: npx tsx scripts/ingest-data.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { readdir, readFile, stat } from 'fs/promises'
import { join, extname } from 'path'

// Dynamic import for vector store to avoid ESM export issues with tsx
let getVectorStore: () => Promise<any>

// Configuration
const DATA_DIR = join(process.cwd(), 'data', 'knowledge-base')
const CHUNK_SIZE = 1000 // Characters per chunk
const CHUNK_OVERLAP = 200 // Overlap between chunks to preserve context

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown']

/**
 * Check if a file is supported
 */
function isSupportedFile(filename: string): boolean {
    const ext = extname(filename).toLowerCase()
    return SUPPORTED_EXTENSIONS.includes(ext)
}

/**
 * Recursively load all supported files from a directory
 */
async function loadFilesFromDirectory(dirPath: string, basePath: string = dirPath): Promise<Array<{ path: string, content: string, category: string }>> {
    const files: Array<{ path: string, content: string, category: string }> = []
    
    try {
        const entries = await readdir(dirPath, { withFileTypes: true })
        
        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name)
            
            if (entry.isDirectory()) {
                // Recursively load from subdirectories
                const subFiles = await loadFilesFromDirectory(fullPath, basePath)
                files.push(...subFiles)
            } else if (entry.isFile() && isSupportedFile(entry.name)) {
                try {
                    const content = await readFile(fullPath, 'utf-8')
                    // Extract category from directory structure
                    // e.g., data/knowledge-base/linux/kernel.md -> category: "linux"
                    const relativePath = fullPath.replace(basePath + '/', '')
                    const category = relativePath.split('/')[0] || 'general'
                    
                    files.push({
                        path: fullPath,
                        content,
                        category
                    })
                } catch (error) {
                    console.warn(`⚠️  Failed to read ${fullPath}:`, error)
                }
            }
        }
    } catch (error) {
        console.warn(`⚠️  Failed to read directory ${dirPath}:`, error)
    }
    
    return files
}

/**
 * Split text into chunks with overlap
 */
async function splitText(content: string, metadata: Record<string, any>): Promise<Document[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: CHUNK_SIZE,
        chunkOverlap: CHUNK_OVERLAP,
        separators: ['\n\n', '\n', '. ', ' ', ''] // Try to split on paragraphs, then sentences, then words
    })
    
    const chunks = await splitter.splitText(content)
    
    return chunks.map((chunk: string, index: number) => {
        return new Document({
            pageContent: chunk,
            metadata: {
                ...metadata,
                chunkIndex: index,
                totalChunks: chunks.length,
                chunkSize: chunk.length
            }
        })
    })
}

/**
 * Extract metadata from file path and content
 */
function extractMetadata(filePath: string, category: string, content: string): Record<string, any> {
    const filename = filePath.split('/').pop() || 'unknown'
    const title = filename.replace(/\.[^/.]+$/, '') // Remove extension
    
    // Extract subcategory from nested paths (e.g., "cloud/aws" -> subcategory: "aws")
    const pathParts = filePath.split('/')
    const subcategory = pathParts.length > 2 ? pathParts[pathParts.length - 2] : undefined
    
    // Try to extract title from markdown if available
    let extractedTitle = title
    if (content.startsWith('# ')) {
        const firstLine = content.split('\n')[0]
        extractedTitle = firstLine.replace(/^#+\s*/, '').trim() || title
    }
    
    // Clean up title (remove "Interviewer Reference" suffix if present)
    extractedTitle = extractedTitle.replace(/\s*_?\s*Interviewer Reference\s*$/i, '').trim()
    
    return {
        source: filename,
        title: extractedTitle,
        category: category,
        subcategory: subcategory, // e.g., "aws", "terraform", "azure_gcp"
        type: 'interviewer_reference', // More specific type
        filePath: filePath,
        // Add URL if it's a known source (can be extended)
        url: getSourceUrl(category, title)
    }
}

/**
 * Get source URL for known documentation sources
 */
function getSourceUrl(category: string, title: string): string | undefined {
    // Map categories/titles to URLs (extend as needed)
    const urlMap: Record<string, string> = {
        'aws': 'https://aws.amazon.com/',
        'cloud': 'https://aws.amazon.com/', // Default for cloud category
        'kubernetes': 'https://kubernetes.io/docs/',
        'linux': 'https://www.kernel.org/',
        'docker': 'https://docs.docker.com/',
        'terraform': 'https://www.terraform.io/docs/',
        'iac': 'https://www.terraform.io/docs/',
        'ci-cd': 'https://www.jenkins.io/doc/',
        'sre': 'https://sre.google/',
    }
    
    return urlMap[category.toLowerCase()]
}

/**
 * Main ingestion function
 */
async function ingest() {
    console.log('🚀 Starting data ingestion to ChromaDB...\n')
    
    // Check if data directory exists
    try {
        const stats = await stat(DATA_DIR)
        if (!stats.isDirectory()) {
            throw new Error(`${DATA_DIR} is not a directory`)
        }
    } catch (error) {
        console.error(`❌ Data directory not found: ${DATA_DIR}`)
        console.log('\n💡 Create the directory structure:')
        console.log('   mkdir -p data/knowledge-base/{linux,architecture,incidents}')
        console.log('   Then add your .txt or .md files to these directories.')
        process.exit(1)
    }
    
    // Load all files
    console.log(`📂 Loading files from ${DATA_DIR}...`)
    const files = await loadFilesFromDirectory(DATA_DIR)
    
    if (files.length === 0) {
        console.warn('⚠️  No supported files found in data/knowledge-base/')
        console.log('\n💡 Supported formats: .txt, .md, .markdown')
        console.log('   Place your files in: data/knowledge-base/{category}/filename.ext')
        process.exit(0)
    }
    
    console.log(`✅ Found ${files.length} file(s)\n`)
    
    // Initialize vector store
    console.log('🔗 Connecting to ChromaDB...')
    const { getVectorStore } = await import('../src/lib/vector-store')
    const vectorStore = await getVectorStore()
    console.log('✅ Connected to ChromaDB\n')
    
    // Process and ingest each file
    let totalChunks = 0
    const documents: Document[] = []
    
    for (const file of files) {
        console.log(`📄 Processing: ${file.path}`)
        
        const metadata = extractMetadata(file.path, file.category, file.content)
        const chunks = await splitText(file.content, metadata)
        
        documents.push(...chunks)
        totalChunks += chunks.length
        
        console.log(`   → Split into ${chunks.length} chunk(s)`)
    }
    
    console.log(`\n📦 Total chunks to ingest: ${totalChunks}\n`)
    
    // Ingest in batches to avoid memory issues
    const BATCH_SIZE = 100
    let ingested = 0
    
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE)
        
        try {
            await vectorStore.addDocuments(batch)
            ingested += batch.length
            console.log(`✅ Ingested batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} chunks (${ingested}/${totalChunks})`)
        } catch (error) {
            console.error(`❌ Failed to ingest batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)
        }
    }
    
    console.log(`\n🎉 Successfully ingested ${ingested} chunks from ${files.length} files!`)
    console.log('\n💡 Your knowledge base is now ready for RAG retrieval.')
}

// Run ingestion
ingest().catch((error) => {
    console.error('❌ Ingestion failed:', error)
    process.exit(1)
})

