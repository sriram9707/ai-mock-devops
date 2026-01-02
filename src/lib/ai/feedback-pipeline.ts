'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

// Step 1: Extract topics discussed from conversation
interface ExtractedTopic {
    name: string
    category: 'Kubernetes' | 'Terraform' | 'CI/CD' | 'AWS' | 'Networking' | 'Security' | 'Other'
    mentionCount: number
    keyMoments: string[] // Relevant quote snippets
}

export async function extractTopicsFromTranscript(
    conversationHistory: { role: string; content: string }[]
): Promise<ExtractedTopic[]> {
    const prompt = `Analyze this technical interview transcript and extract all technical topics discussed.

For each topic, identify:
1. The specific technology/concept (e.g., "Kubernetes Pod Debugging", "Terraform State Management")
2. Category (Kubernetes, Terraform, CI/CD, AWS, Networking, Security, Other)
3. How many times it was mentioned
4. Key moments (short quotes showing when it was discussed)

Conversation:
${conversationHistory.map((msg, idx) => `${idx + 1}. ${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

Return ONLY valid JSON array:
[
  {
    "name": "Kubernetes Pod Lifecycle",
    "category": "Kubernetes",
    "mentionCount": 5,
    "keyMoments": [
      "discussed crashlooping pods",
      "explained kubectl describe output"
    ]
  }
]`

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Faster, cheaper for extraction
            messages: [
                { role: 'system', content: 'You are a technical interview analyzer. Extract topics discussed. Return only JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) return []

        const parsed = JSON.parse(content)
        return parsed.topics || parsed || []
    } catch (error) {
        console.error('Error extracting topics:', error)
        return []
    }
}

// Step 2: Score each topic with evidence (parallel execution)
interface TopicScore {
    topic: string
    overallScore: number
    subTopicScores: {
        name: string
        score: number
        assessment: 'strong' | 'adequate' | 'weak'
        evidence: string // What they said
        feedback: string // Specific feedback
    }[]
    keyStrengths: string[]
    keyWeaknesses: string[]
}

export async function scoreTopicWithEvidence(
    topic: ExtractedTopic,
    fullConversation: { role: string; content: string }[]
): Promise<TopicScore> {
    const prompt = `You are evaluating a candidate's performance on the topic: "${topic.name}"

Conversation context:
${fullConversation.map((msg, idx) => `${idx + 1}. ${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

Analyze ONLY the parts of the conversation related to "${topic.name}".

For this topic:
1. Break down into 2-4 sub-topics (e.g., for "Kubernetes Pod Debugging": Pod Lifecycle, Troubleshooting Commands, Secret Management)
2. For each sub-topic, provide:
   - Score (0-10)
   - Assessment (strong/adequate/weak)
   - Evidence: QUOTE or paraphrase what the candidate said
   - Specific feedback with technical accuracy check

CRITICAL: Base scores on CORRECTNESS, not participation.
- If they gave WRONG technical information, score 3-6
- If they gave CORRECT answers, score 7-10

Return ONLY valid JSON:
{
  "topic": "${topic.name}",
  "overallScore": 7.5,
  "subTopicScores": [
    {
      "name": "Pod Lifecycle Understanding",
      "score": 9,
      "assessment": "strong",
      "evidence": "Correctly explained 'kubectl describe pod shows events, then kubectl logs for container output'",
      "feedback": "Excellent understanding of pod debugging workflow. Showed knowledge of proper troubleshooting sequence."
    }
  ],
  "keyStrengths": ["Strong debugging methodology"],
  "keyWeaknesses": ["Missed secret management best practices"]
}`

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Full model for accurate technical evaluation
            messages: [
                { role: 'system', content: 'You are a strict technical evaluator. Score based on correctness. Return only JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('No response')

        return JSON.parse(content) as TopicScore
    } catch (error) {
        console.error(`Error scoring topic ${topic.name}:`, error)
        // Fallback
        return {
            topic: topic.name,
            overallScore: 5,
            subTopicScores: [],
            keyStrengths: [],
            keyWeaknesses: ['Unable to evaluate due to processing error']
        }
    }
}

// Step 3: Generate comprehensive upskilling plan
interface UpskillingPlan {
    weeks: number
    weeklyBreakdown: {
        week: number
        focus: string
        tasks: string[]
        resources: string[]
    }[]
}

export async function generateDetailedUpskillingPlan(
    topicScores: TopicScore[],
    overallScore: number
): Promise<UpskillingPlan> {
    // Find weak areas (score < 7)
    const weakTopics = topicScores.filter(t => t.overallScore < 7)
    const allWeaknesses = topicScores.flatMap(t => t.keyWeaknesses)

    const prompt = `Create a detailed upskilling plan for a DevOps/SRE candidate who scored ${overallScore}/100.

Weak areas identified:
${weakTopics.map(t => `- ${t.topic} (${t.overallScore}/10): ${t.keyWeaknesses.join(', ')}`).join('\n')}

Create a 3-4 week plan with:
1. Week-by-week focus areas (prioritize critical gaps)
2. 3-4 specific, actionable tasks per week
3. Curated resources (documentation, tutorials, hands-on labs)

IMPORTANT:
- Tasks should be SPECIFIC (not "learn Kubernetes" but "Complete K8s CKA sections 2-4 on pod lifecycle")
- Include hands-on practice (not just reading)
- Provide actual resource links where possible

Return ONLY valid JSON:
{
  "weeks": 4,
  "weeklyBreakdown": [
    {
      "week": 1,
      "focus": "Kubernetes Secret Management & Security",
      "tasks": [
        "Complete Kubernetes security best practices tutorial",
        "Practice: Set up Sealed Secrets or External Secrets Operator",
        "Read: Kubernetes Secrets documentation and encryption at rest setup"
      ],
      "resources": [
        "https://kubernetes.io/docs/concepts/configuration/secret/",
        "https://github.com/bitnami-labs/sealed-secrets"
      ]
    }
  ]
}`

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Can use o1 for deeper reasoning if needed
            messages: [
                { role: 'system', content: 'You are a learning path expert. Create actionable, specific upskilling plans. Return only JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('No response')

        // Extract JSON from response (might have markdown formatting)
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON found')

        return JSON.parse(jsonMatch[0]) as UpskillingPlan
    } catch (error) {
        console.error('Error generating upskilling plan:', error)
        // Fallback
        return {
            weeks: 2,
            weeklyBreakdown: [
                {
                    week: 1,
                    focus: 'General DevOps practice',
                    tasks: ['Review weak areas from interview', 'Practice hands-on labs'],
                    resources: ['https://kubernetes.io/docs/']
                }
            ]
        }
    }
}

// Step 4: Orchestrate the entire pipeline
export async function generateFeedbackPipeline(
    conversationHistory: { role: string; content: string }[]
) {
    console.log('🔄 Starting hybrid feedback pipeline...')

    // Step 1: Extract topics (fast, cheap model)
    console.log('📊 Step 1: Extracting topics...')
    const topics = await extractTopicsFromTranscript(conversationHistory)
    console.log(`✅ Extracted ${topics.length} topics`)

    // Step 2: Score each topic in PARALLEL (GPT-4)
    console.log('🎯 Step 2: Scoring topics in parallel...')
    const topicScores = await Promise.all(
        topics.map(topic => scoreTopicWithEvidence(topic, conversationHistory))
    )
    console.log(`✅ Scored ${topicScores.length} topics`)

    // Calculate overall score from topic scores
    const avgTopicScore = topicScores.length > 0
        ? topicScores.reduce((sum, t) => sum + t.overallScore, 0) / topicScores.length
        : 0
    const overallScore = Math.round(avgTopicScore * 10) // Convert to 0-100 scale

    // Step 3: Generate detailed upskilling plan
    console.log('📚 Step 3: Generating upskilling plan...')
    const upskillingPlan = await generateDetailedUpskillingPlan(topicScores, overallScore)
    console.log('✅ Upskilling plan generated')

    // Step 4: Compile final result
    return {
        topics: topicScores,
        overallScore,
        upskillingPlan,
        timestamp: new Date().toISOString()
    }
}
