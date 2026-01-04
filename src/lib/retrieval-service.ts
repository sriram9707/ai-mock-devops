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
import { INTERVIEW_TOPICS } from './ai/interview-flow'

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
        const results: { category: string, scenarios: string[] }[] = []

        // 1. Identify relevant topics from INTERVIEW_TOPICS based on candidate tech or role
        const relevantTopics = INTERVIEW_TOPICS.filter(topic => {
            // Check if topic ID matches any candidate tech
            const matchesTech = candidateTech.some(tech =>
                tech.toLowerCase().includes(topic.id) ||
                topic.name.toLowerCase().includes(tech.toLowerCase())
            )
            // Or if it's a core topic for the role (e.g. DevOps -> All topics usually apply)
            const isCore = roleType.toLowerCase().includes('devops') || roleType.toLowerCase().includes('sre')

            return matchesTech || isCore
        })

        // 2. Select top 3 relevant topics (Randomized to avoid repetition)
        const selectedTopics = relevantTopics
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)

        for (const topic of selectedTopics) {
            // Get level-specific focus items from the user's curriculum
            let focusItems: string[] = []
            if (roleLevel.toLowerCase().includes('senior')) {
                focusItems = topic.seniorLevelFocus
            } else if (roleLevel.toLowerCase().includes('architect')) {
                focusItems = topic.architectLevelFocus
            } else {
                focusItems = topic.entryLevelFocus
            }

            // Shuffle and pick 3 random focus items to keep it dynamic
            const shuffledItems = focusItems.sort(() => 0.5 - Math.random()).slice(0, 3)

            // HYBRID APPROACH: Use User's Topic + RAG Context
            // We use the specific topic "StatefulSet Corruption" to search the Knowledge Base
            const enrichedScenarios: string[] = []

            for (const item of shuffledItems) {
                // 1. Start with the user's specific instruction
                let scenarioText = `Ask about: ${item}`

                // 2. Fetch context from RAG (ID Match -> Vector Fallback)
                try {
                    // Strategy A: Try strict ID match first
                    // "StatefulSet data corruption" -> "statefulset-data-corruption"
                    const slug = item
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '')

                    // We use `similaritySearch` but filter extremely strictly by ID
                    // Note: LangChain JS doesn't always support pure filter without query in all stores,
                    // but we can pass the item as query + filter
                    const idDocs = await vectorStore.similaritySearch(item, 1, { id: slug })

                    if (idDocs.length > 0) {
                        console.log(`✅ Found exact RAG match for ID: ${slug}`)
                        const context = idDocs[0].pageContent.substring(0, 500)
                        // Add explicit instruction that this is the GOLDEN ANSWER
                        scenarioText += `\n[Official Troubleshooting Guide]: ${context}`
                    } else {
                        // Strategy B: Fallback to similarity search
                        console.log(`⚠️ No ID match for ${slug}, falling back to similarity search`)
                        const similarDocs = await vectorStore.similaritySearch(`${item} troubleshooting guide steps`, 1)
                        if (similarDocs.length > 0) {
                            const context = similarDocs[0].pageContent.substring(0, 300)
                            scenarioText += `\n[Reference Context]: ${context}`
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to fetch RAG context for ${item}`)
                }

                enrichedScenarios.push(scenarioText)
            }

            if (enrichedScenarios.length > 0) {
                results.push({
                    category: topic.name,
                    scenarios: enrichedScenarios
                })
            }

            // OPTIONAL: Fallback to purely RAG if no focus items existed in the static list
            if (enrichedScenarios.length === 0) {
                const query = `${topic.name} ${roleLevel} production incident scenario`
                const docs = await vectorStore.similaritySearch(query, 2)
                const vectorScenarios = docs.map(d => d.pageContent.substring(0, 300))
                if (vectorScenarios.length > 0) {
                    results.push({ category: `${topic.name} (RAG)`, scenarios: vectorScenarios })
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
