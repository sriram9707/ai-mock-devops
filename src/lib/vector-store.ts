import { Chroma } from '@langchain/community/vectorstores/chroma'
import { OpenAIEmbeddings } from '@langchain/openai'

// Singleton instance to avoid multiple corrections
let vectorStore: Chroma | null = null

export async function getVectorStore() {
    if (vectorStore) return vectorStore

    // Initialize OpenAI Embeddings
    const embeddings = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        // Optional: dimension: 1536
    })

    // Connect to local ChromaDB
    // Assumes Chroma is running locally on port 8000
    // If running in Docker, might be http://chroma:8000
    vectorStore = new Chroma(embeddings, {
        collectionName: 'aws-well-architected',
        url: process.env.CHROMA_DB_URL || 'http://localhost:8000',
    })

    return vectorStore
}
