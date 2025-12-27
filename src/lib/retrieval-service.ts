import { getVectorStore } from './vector-store'

export async function retrieveContext(query: string, roleLevel: string = 'Mid'): Promise<string> {
    try {
        const vectorStore = await getVectorStore()

        // Define metadata filter based on role level
        // For Senior roles, we might prioritize "Design Principles" or "Architecture"
        // For now, we'll just do a semantic search without strict filters to ensure results
        // Advanced: const filter = roleLevel === 'Senior' ? { type: 'principle' } : undefined

        // Retrieve top 3 relevant documents
        // k = 3
        const results = await vectorStore.similaritySearch(query, 3)

        if (results.length === 0) {
            return ''
        }

        // Format the context for the LLM
        const formattedContext = results.map(doc => {
            return `[SOURCE: AWS Well-Architected Framework]\n${doc.pageContent}`
        }).join('\n\n')

        return formattedContext
    } catch (error) {
        console.error('Error retrieving context:', error)
        return '' // Fail gracefully to avoid breaking the interview
    }
}
