import { NextResponse } from 'next/server'
import { getVectorStore } from '@/lib/vector-store'
import { INTERVIEW_TOPICS } from '@/lib/ai/interview-flow'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const vectorStore = await getVectorStore()

        const coverageMap: any[] = []
        let totalTopics = 0
        let coveredTopics = 0
        let idMatches = 0
        let semanticMatches = 0

        // Flatten all topics
        const allTopics: string[] = []
        INTERVIEW_TOPICS.forEach(t => {
            allTopics.push(...t.entryLevelFocus)
            allTopics.push(...t.seniorLevelFocus)
            allTopics.push(...t.architectLevelFocus)
        })

        for (const topic of allTopics) {
            totalTopics++
            const slug = topic.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')

            try {
                // Use score for better analysis
                const results = await vectorStore.similaritySearchWithScore(topic, 1) // default query

                let status = '❌ Missing'
                let score = 2.0 // High distance
                let matchType = 'none'

                if (results.length > 0) {
                    const [doc, s] = results[0]
                    score = s

                    // Check ID match
                    if (doc.metadata && doc.metadata.id === slug) {
                        status = '✅ ID Match'
                        matchType = 'id'
                        idMatches++
                        coveredTopics++
                    } else if (s < 0.85) { // Empirically, < 0.85 is a good semantic match
                        status = '⚠️ Semantic Match'
                        matchType = 'semantic'
                        semanticMatches++
                        coveredTopics++
                    }
                }

                coverageMap.push({
                    topic,
                    slug,
                    status,
                    score: score.toFixed(2),
                    bestMatchFile: results.length > 0 ? (results[0][0].metadata.source || 'unknown') : 'none'
                })

            } catch (err) {
                console.error(`Error checking topic ${topic}:`, err)
                coverageMap.push({ topic, status: 'Error', error: String(err) })
            }
        }

        const coveragePercent = totalTopics > 0 ? ((coveredTopics / totalTopics) * 100).toFixed(1) : '0'

        return NextResponse.json({
            summary: {
                totalTopics,
                coveredTopics,
                coveragePercent: `${coveragePercent}%`,
                breakdown: {
                    idMatches,
                    semanticMatches,
                    missing: totalTopics - coveredTopics
                }
            },
            details: coverageMap
        })

    } catch (error) {
        console.error('Debug route error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
