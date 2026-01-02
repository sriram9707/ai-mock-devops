/**
 * Concurrent Interview Test
 * Simulates 5 interviews running simultaneously to verify question diversity
 */

import 'dotenv/config'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

interface TestCandidate {
    id: number
    name: string
    background: string
    techStack: string[]
}

const CANDIDATES: TestCandidate[] = [
    {
        id: 1,
        name: 'Sriram',
        background: '3 years DevOps, AWS (EKS, VPC, S3), Kubernetes, Terraform',
        techStack: ['Kubernetes', 'AWS', 'Terraform']
    },
    {
        id: 2,
        name: 'Maya',
        background: '4 years SRE, GCP (GKE, Cloud Storage), Kubernetes, Prometheus',
        techStack: ['Kubernetes', 'GCP', 'Observability']
    },
    {
        id: 3,
        name: 'Raj',
        background: '2 years Platform Engineer, AWS (ECS, Lambda), Docker, CI/CD',
        techStack: ['AWS', 'CI/CD', 'Containers']
    },
    {
        id: 4,
        name: 'Priya',
        background: '5 years Cloud Architect, Multi-cloud (AWS, Azure), Terraform, Kubernetes',
        techStack: ['AWS', 'Azure', 'Terraform', 'Kubernetes']
    },
    {
        id: 5,
        name: 'Arjun',
        background: '3 years DevOps, Kubernetes, ArgoCD, GitLab CI, Helm',
        techStack: ['Kubernetes', 'GitOps', 'CI/CD']
    },
    {
        id: 6,
        name: 'Neha',
        background: '4 years SRE, AWS (CloudWatch, Lambda), Datadog, Terraform',
        techStack: ['AWS', 'Observability', 'Terraform']
    },
    {
        id: 7,
        name: 'Karthik',
        background: '3 years DevOps, Azure (AKS, Storage), Kubernetes, Jenkins',
        techStack: ['Azure', 'Kubernetes', 'CI/CD']
    },
    {
        id: 8,
        name: 'Divya',
        background: '5 years Platform Engineer, Multi-cloud, Kubernetes, Istio, Prometheus',
        techStack: ['Kubernetes', 'Service Mesh', 'Observability']
    },
    {
        id: 9,
        name: 'Anil',
        background: '2 years DevOps, AWS (EKS, RDS, ElastiCache), Docker, GitHub Actions',
        techStack: ['AWS', 'Kubernetes', 'CI/CD']
    },
    {
        id: 10,
        name: 'Shruti',
        background: '4 years Cloud Engineer, GCP (GKE, BigQuery), Terraform, Kubernetes',
        techStack: ['GCP', 'Kubernetes', 'Terraform']
    }
]

interface InterviewResult {
    candidateId: number
    candidateName: string
    questions: string[]
    categories: string[]
}

async function simulateInterview(candidate: TestCandidate, questionCount: number = 6): Promise<InterviewResult> {
    const messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }> = []
    const result: InterviewResult = {
        candidateId: candidate.id,
        candidateName: candidate.name,
        questions: [],
        categories: []
    }

    console.log(`\n🎭 [${candidate.name}] Starting interview...`)

    // Alex's first message
    const firstMessage = "Hi, I'm Alex. To get started, could you give me a brief overview of your background?"
    messages.push({ role: 'assistant', content: firstMessage })

    // Candidate intro
    const intro = `Hi Alex, I'm ${candidate.name}. ${candidate.background}. Looking forward to the interview!`
    console.log(`👤 [${candidate.name}] ${intro}`)
    messages.push({ role: 'user', content: intro })

    // Simulate questions
    for (let i = 1; i <= questionCount; i++) {
        // Get Alex's question (simulated with category awareness)
        const systemPrompt = `You are Alex, interviewing a ${candidate.techStack[0]} specialist.
        
CRITICAL RULES:
- Ask ONE specific scenario question at a time
- Focus on these categories: ${candidate.techStack.join(', ')}
- Progress through categories: Start with ${candidate.techStack[0]}, then ${candidate.techStack[1] || candidate.techStack[0]}
- After 3 questions on a category, move to next
- Each question should be a realistic production scenario
- Keep responses SHORT

Current question ${i} of ${questionCount}.
${i <= 3 ? `Focus on ${candidate.techStack[0]}` : i <= 5 ? `Focus on ${candidate.techStack[1] || candidate.techStack[0]}` : 'Wrap up'}`

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ] as any,
            temperature: 0.8, // Higher for variety
            max_tokens: 150,
        })

        const alexQuestion = response.choices[0]?.message?.content || 'Tell me about your experience.'
        console.log(`🤖 [${candidate.name}] Q${i}: ${alexQuestion}`)

        result.questions.push(alexQuestion)
        messages.push({ role: 'assistant', content: alexQuestion })

        // Extract category
        const categoryMatch = alexQuestion.match(/\b(Kubernetes|AWS|GCP|Terraform|CI\/CD|Docker|EKS|GKE|VPC|S3|Lambda|ArgoCD|Deployment|Service|Storage|Network|RBAC|Security)\b/i)
        if (categoryMatch && !result.categories.includes(categoryMatch[0])) {
            result.categories.push(categoryMatch[0])
        }

        // Candidate response (kept short to focus on questions)
        const candidateResponse = await generateResponse(alexQuestion, candidate)
        messages.push({ role: 'user', content: candidateResponse })

        // Small delay to simulate real conversation
        await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ [${candidate.name}] Interview complete\n`)
    return result
}

async function generateResponse(question: string, candidate: TestCandidate): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are ${candidate.name}, a candidate with: ${candidate.background}. Answer briefly (2-3 sentences).`
            },
            {
                role: 'user',
                content: question
            }
        ] as any,
        temperature: 0.7,
        max_tokens: 80,
    })
    return response.choices[0]?.message?.content || 'That\'s a good question.'
}

async function analyzeResults(results: InterviewResult[]) {
    console.log('\n' + '═'.repeat(100))
    console.log('📊 CONCURRENT INTERVIEW ANALYSIS')
    console.log('═'.repeat(100))

    // Check for question diversity
    const allQuestions = results.flatMap(r => r.questions)
    const uniqueQuestions = new Set(allQuestions)

    console.log(`\n🔍 Question Diversity:`)
    console.log(`   Total questions asked: ${allQuestions.length}`)
    console.log(`   Unique questions: ${uniqueQuestions.size}`)
    console.log(`   Diversity rate: ${((uniqueQuestions.size / allQuestions.length) * 100).toFixed(1)}%`)

    // Expected: >80% unique (some overlap is okay for similar tech stacks)
    const diversityPass = (uniqueQuestions.size / allQuestions.length) > 0.8
    console.log(`   ${diversityPass ? '✅ PASS' : '❌ FAIL'} - ${diversityPass ? 'Good diversity' : 'Too much repetition'}`)

    // Check category coverage
    console.log(`\n📚 Category Coverage per Candidate:`)
    results.forEach(r => {
        console.log(`   ${r.candidateName}: ${r.categories.join(', ')} (${r.categories.length} categories)`)
    })

    // Detailed comparison
    console.log(`\n📝 Question-by-Question Comparison:\n`)

    for (let qNum = 0; qNum < 6; qNum++) {
        console.log(`Question ${qNum + 1}:`)
        results.forEach(r => {
            const question = r.questions[qNum] || 'N/A'
            const preview = question.substring(0, 80) + (question.length > 80 ? '...' : '')
            console.log(`   [${r.candidateName}]: ${preview}`)
        })
        console.log('')
    }

    // Find duplicates
    const questionCounts = new Map<string, string[]>()
    results.forEach(r => {
        r.questions.forEach(q => {
            const simplified = q.toLowerCase().replace(/[^a-z ]/g, '').substring(0, 50)
            if (!questionCounts.has(simplified)) {
                questionCounts.set(simplified, [])
            }
            questionCounts.get(simplified)!.push(r.candidateName)
        })
    })

    const duplicates = Array.from(questionCounts.entries())
        .filter(([_, candidates]) => candidates.length > 1)

    if (duplicates.length > 0) {
        console.log(`\n⚠️  Duplicate Questions Found:`)
        duplicates.forEach(([question, candidates]) => {
            console.log(`   "${question}..." asked to: ${candidates.join(', ')}`)
        })
    } else {
        console.log(`\n✅ No duplicate questions detected!`)
    }

    // Final verdict
    console.log(`\n${'═'.repeat(100)}`)
    console.log(`🎯 FINAL VERDICT`)
    console.log(`${'═'.repeat(100)}`)
    console.log(`Diversity: ${diversityPass ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Duplicates: ${duplicates.length === 0 ? '✅ PASS (None found)' : `⚠️  ${duplicates.length} found`}`)
    console.log(`Category Adaptation: ${results.every(r => r.categories.length >= 2) ? '✅ PASS' : '❌ FAIL'}`)
}

// Run concurrent test
async function runConcurrentTest() {
    console.log('🚀 Starting 10 concurrent (20 questions each) interview simulations...\n')

    // Run all interviews in parallel
    const results = await Promise.all(
        CANDIDATES.map(candidate => simulateInterview(candidate, 20))
    )

    // Analyze results
    await analyzeResults(results)
}

runConcurrentTest().then(() => {
    console.log('\n✅ Test complete!')
    process.exit(0)
}).catch(err => {
    console.error('❌ Test failed:', err)
    process.exit(1)
})
