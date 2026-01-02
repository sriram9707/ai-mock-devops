import { Chroma } from '@langchain/community/vectorstores/chroma'
import { OpenAIEmbeddings } from '@langchain/openai'
import { ChromaClient } from 'chromadb'

// Singleton instance to avoid multiple connections
let vectorStore: Chroma | null = null

export async function getVectorStore() {
    if (vectorStore) return vectorStore

    // Initialize OpenAI Embeddings
    const embeddings = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        // Optional: dimension: 1536
    })

    // ChromaDB connection configuration
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000'
    const collectionName = process.env.CHROMA_COLLECTION_NAME || 'aws-well-architected'

    // Parse URL to extract host and port
    const url = new URL(chromaUrl)
    const host = url.hostname
    const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 8000)

    try {
        // Initialize ChromaDB client to check if collection exists
        // Use host and port instead of deprecated 'path'
        const client = new ChromaClient({
            host: host,
            port: port
        })

        // Check if collection exists
        let collectionExists = false
        try {
            const collections = await client.listCollections()
            collectionExists = collections.some((c: any) => c.name === collectionName)
        } catch (e) {
            // If listing fails, collection doesn't exist
            collectionExists = false
        }

        if (collectionExists) {
            // Connect to existing collection
            vectorStore = await Chroma.fromExistingCollection(
                embeddings,
                {
                    collectionName,
                    url: chromaUrl
                }
            )
            console.log(`✅ Connected to existing ChromaDB collection: ${collectionName}`)
        } else {
            // Create new collection - Chroma will create it on first document add
            // Use a placeholder text that's not empty (OpenAI rejects empty strings)
            // ChromaDB requires non-empty metadata
            console.log(`📦 Creating ChromaDB collection: ${collectionName}`)
            vectorStore = await Chroma.fromTexts(
                ['Initializing collection'], // Non-empty placeholder text
                [{ type: 'initialization', source: 'system' }], // Non-empty metadata (required by ChromaDB)
                embeddings,
                {
                    collectionName,
                    url: chromaUrl
                }
            )
            console.log(`✅ ChromaDB collection ready: ${collectionName}`)
        }
    } catch (error: any) {
        console.error('❌ Error connecting to ChromaDB:', error)
        // If it's a connection error, provide helpful message
        if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
            throw new Error(
                `Failed to connect to ChromaDB at ${chromaUrl}. ` +
                `Ensure ChromaDB is running: docker run -p 8000:8000 chromadb/chroma`
            )
        }
        throw new Error(`Failed to connect to ChromaDB: ${error.message}`)
    }

    return vectorStore
}
