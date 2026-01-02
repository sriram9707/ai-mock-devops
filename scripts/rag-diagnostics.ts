import * as dotenv from 'dotenv'
import { ChromaClient } from 'chromadb'
import { getVectorStore } from '../src/lib/vector-store'

dotenv.config({ path: '.env.local' })

function getChromaClient(chromaUrl: string): ChromaClient {
    const url = new URL(chromaUrl)
    const host = url.hostname
    const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 8000)

    return new ChromaClient({ host, port })
}

async function ensureCollection(client: ChromaClient, collectionName: string): Promise<void> {
    const collections = await client.listCollections()
    const exists = collections.some(collection => collection.name === collectionName)

    if (exists) return

    console.warn(`⚠️ Collection "${collectionName}" not found. Creating it with the default vector store initializer...`)
    await getVectorStore()
}

function describeMetadata(metadata: Record<string, unknown> | undefined): string {
    if (!metadata) return 'No metadata present'

    const keys = Object.keys(metadata)
    if (keys.length === 0) return 'Empty metadata'

    return keys
        .map(key => `${key}: ${metadata[key]}`)
        .join('; ')
}

async function runDiagnostics() {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000'
    const collectionName = process.env.CHROMA_COLLECTION_NAME || 'aws-well-architected'

    console.log(`🔍 Inspecting Chroma collection "${collectionName}" at ${chromaUrl}`)
    const client = getChromaClient(chromaUrl)

    await ensureCollection(client, collectionName)

    const collection = await client.getCollection({ name: collectionName })
    const documentCount = await collection.count()

    console.log(`📦 Documents in collection: ${documentCount}`)

    const sample = await collection.peek({ limit: 3 })
    const docs = sample?.documents || []
    const metadata = sample?.metadatas || []

    if (!docs.length) {
        console.warn('⚠️ No documents available to preview. Seed the vector store before relying on RAG.')
        return
    }

    console.log('\n🧠 Sample documents:')
    docs.forEach((doc, index) => {
        const preview = doc.substring(0, 240).replace(/\s+/g, ' ').trim()
        console.log(`\n#${index + 1}`)
        console.log(`Content preview: ${preview}`)
        console.log(`Metadata: ${describeMetadata(metadata[index])}`)
    })
}

runDiagnostics().catch(error => {
    console.error('❌ RAG diagnostics failed:', error)
    process.exit(1)
})
