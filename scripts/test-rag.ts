import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { retrieveContext } from '../src/lib/retrieval-service'

async function testRAG() {
    console.log('🧪 Testing RAG System...')

    try {
        const query = "How do I secure an EC2 instance?"
        console.log(`📝 Query: "${query}"`)

        const context = await retrieveContext(query, 'Senior')

        if (context) {
            console.log('✅ Success! Retrieved context:')
            console.log('----------------------------')
            console.log(context.substring(0, 200) + '...')
            console.log('----------------------------')
        } else {
            console.log('⚠️ No context retrieved. Is the vector store seeded?')
        }
    } catch (error) {
        console.error('❌ RAG System Error:', error)
        console.log('💡 Ensure ChromaDB is running on http://localhost:8000')
    }
}

testRAG()
