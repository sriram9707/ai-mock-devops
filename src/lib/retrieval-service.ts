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

        // Format the context for the LLM with source metadata if available
        const formattedContext = results.map((doc: { pageContent: string; metadata?: Record<string, any> }) => {
            // Extract source metadata if available (ChromaDB supports metadata)
            const source = doc.metadata?.source || 'AWS Well-Architected Framework'
            const sourceUrl = doc.metadata?.url || ''
            const sourceTag = sourceUrl ? `[SOURCE: ${source}](${sourceUrl})` : `[SOURCE: ${source}]`
            return `${sourceTag}\n${doc.pageContent}`
        }).join('\n\n')

        return formattedContext
    } catch (error) {
        console.error('Error retrieving context:', error)
        return '' // Fail gracefully to avoid breaking the interview
    }
}


/**
 * Category-aware scenario retrieval for structured interviews
 * Retrieves scenarios organized by technology categories for deep, focused questioning
 */
export async function retrieveCategoryScenarios(
    roleType: string,
    roleLevel: string,
    candidateTech: string[] = []
): Promise<{ category: string, scenarios: string[] }[]> {
    try {
        const vectorStore = await getVectorStore()

        // Technology categories mapping
        const categoryMap: Record<string, string[]> = {
            'Kubernetes': ['Deployment Issues', 'Service & Networking', 'Storage Issues', 'RBAC & Security'],
            'AWS': ['EC2 & Networking', 'S3 & Storage', 'VPC & Connectivity', 'EKS & Containers', 'IAM & Security'],
            'Terraform': ['State Management', 'Resource Dependencies', 'Module Design'],
            'CI/CD': ['Pipeline Failures', 'Deployment Strategies', 'GitOps Workflows']
        }

        // Detect tech stack from role or use candidate's mentioned tech
        const techStack = candidateTech.length > 0 ? candidateTech :
            (roleType.toLowerCase().includes('devops') ? ['Kubernetes', 'AWS', 'Terraform'] : ['AWS'])

        const results: { category: string, scenarios: string[] }[] = []

        // Retrieve 2 scenarios per category
        for (const tech of techStack.slice(0, 2)) { // Focus on 2 main technologies
            const categories = categoryMap[tech] || [tech]

            for (const category of categories.slice(0, 3)) { // 3 categories per tech
                const query = `${tech} ${category} ${roleLevel} production incident scenario`
                const docs = await vectorStore.similaritySearch(query, 2)

                const scenarios = docs
                    .filter(doc => doc.pageContent && doc.pageContent.length > 100)
                    .map(doc => doc.pageContent.substring(0, 500)) // Limit length

                if (scenarios.length > 0) {
                    results.push({ category: `${tech}: ${category}`, scenarios })
                }
            }
        }

        return results
    } catch (error) {
        console.error('Error retrieving category scenarios:', error)
        return []
    }
}

/**
 * Preload top realistic scenarios for interview memory layer
 * This gives Alex specific scenarios upfront instead of generating generic ones
 */
export async function retrieveTopScenarios(roleType: string, roleLevel: string, limit: number = 10): Promise<string> {
    try {
        const vectorStore = await getVectorStore()

        // Query for role-specific scenarios
        const queries = [
            `${roleType} ${roleLevel} production incident troubleshooting scenario`,
            `${roleType} real-world debugging challenge`,
            `${roleType} critical system failure scenario`,
            `${roleType} performance optimization problem`,
            `${roleType} security incident response`
        ]

        const allScenarios: string[] = []

        // Retrieve scenarios for each query
        for (const query of queries) {
            const results = await vectorStore.similaritySearch(query, 2) // 2 per query = 10 total
            results.forEach(doc => {
                if (doc.pageContent && doc.pageContent.length > 50) { // Filter out too-short content
                    allScenarios.push(doc.pageContent)
                }
            })
        }

        // Deduplicate and limit
        const uniqueScenarios = [...new Set(allScenarios)].slice(0, limit)

        if (uniqueScenarios.length === 0) {
            return ''
        }

        // Format as memory bank
        const memoryBank = uniqueScenarios.map((scenario, idx) =>
            `**Scenario ${idx + 1}**: ${scenario}`
        ).join('\n\n')

        return memoryBank
    } catch (error) {
        console.error('Error preloading scenarios:', error)
        return '' // Fail gracefully
    }
}
