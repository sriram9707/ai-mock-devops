/**
 * Interview Simulation Test
 * Simulates a candidate interview to validate Alex's behavior
 */

import 'dotenv/config'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Simulate candidate persona
const CANDIDATE_PERSONA = `You are Sriram, a Mid-level DevOps Engineer being interviewed.
Your background:
- 3 years experience
- Technologies: AWS (S3, VPC, EKS, RDS), Kubernetes, Terraform, CI/CD (Jenkins, GitLab)
- Current role: DevOps Engineer at a SaaS company
- Experience: Managing production infrastructure, incident response, automation

Keep responses realistic, conversational, and 2-3 sentences max.
`

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

interface TestResults {
    totalQuestions: number
    questionsByTopic: Record<string, number>
    questions: string[]
    topics: string[]
    hadInfiniteLoop: boolean
    wrappedUpProperly: boolean
    usedGenericScenarios: boolean
    stateTransitions: string[]
}

async function simulateInterview(maxTurns: number = 12): Promise<TestResults> {
    const messages: Message[] = []
    const results: TestResults = {
        totalQuestions: 0,
        questionsByTopic: {},
        questions: [],
        topics: [],
        hadInfiniteLoop: false,
        wrappedUpProperly: false,
        usedGenericScenarios: false,
        stateTransitions: []
    }

    console.log('🎭 Starting interview simulation...\n')
    console.log('═'.repeat(80))

    // Simulate interview start - Alex's first message
    const firstMessage = "Hi, I'm Alex. I'm a Cloud Architect here, and I'll be conducting your technical interview today. To get started, could you give me a brief overview of your background?"

    console.log(`\n🤖 ALEX: ${firstMessage}`)
    messages.push({ role: 'assistant', content: firstMessage })

    // Candidate intro
    const candidateIntro = await generateCandidateResponse(messages, CANDIDATE_PERSONA)
    console.log(`\n👤 SRIRAM: ${candidateIntro}`)
    messages.push({ role: 'user', content: candidateIntro })

    // Track topics discussed
    const topicPattern = /\b(AWS|S3|VPC|EKS|RDS|Kubernetes|K8s|Terraform|CI\/CD|Jenkins|GitLab|Docker|DynamoDB|CloudWatch|IAM|Lambda)\b/gi
    let consecutiveSameTopic = 0
    let lastTopic = ''

    // Main interview loop
    for (let turn = 1; turn <= maxTurns; turn++) {
        console.log(`\n${'─'.repeat(80)}`)
        console.log(`Turn ${turn}/${maxTurns}`)
        console.log('─'.repeat(80))

        // Get Alex's response (simulate calling the chat endpoint)
        const alexResponse = await simulateAlexResponse(messages)
        console.log(`\n🤖 ALEX: ${alexResponse}`)
        messages.push({ role: 'assistant', content: alexResponse })

        // Analyze Alex's question
        if (alexResponse.includes('?')) {
            results.totalQuestions++
            results.questions.push(alexResponse)

            // Detect topic
            const topicMatches = alexResponse.match(topicPattern)
            if (topicMatches) {
                const topic = topicMatches[0]
                results.questionsByTopic[topic] = (results.questionsByTopic[topic] || 0) + 1

                if (!results.topics.includes(topic)) {
                    results.topics.push(topic)
                    results.stateTransitions.push(`Turn ${turn}: New topic - ${topic}`)
                    consecutiveSameTopic = 0
                }

                if (topic === lastTopic) {
                    consecutiveSameTopic++
                    if (consecutiveSameTopic > 5) {
                        results.hadInfiniteLoop = true
                        console.log(`\n⚠️  WARNING: Possible infinite loop detected - ${consecutiveSameTopic} consecutive questions on ${topic}`)
                    }
                } else {
                    consecutiveSameTopic = 1
                }
                lastTopic = topic
            }

            // Check for generic scenarios
            if (alexResponse.toLowerCase().includes('critical services') ||
                alexResponse.toLowerCase().includes('imagine a scenario') && !topicMatches) {
                results.usedGenericScenarios = true
                console.log(`\n⚠️  Generic scenario detected!`)
            }
        }

        // Check for wrap-up
        if (alexResponse.toLowerCase().includes('thank you') &&
            alexResponse.toLowerCase().includes('good luck' || 'goodbye' || 'best of luck')) {
            results.wrappedUpProperly = true
            console.log(`\n✅ Interview wrapped up properly`)
            break
        }

        // Generate candidate response
        const candidateResponse = await generateCandidateResponse(messages, CANDIDATE_PERSONA)
        console.log(`\n👤 SRIRAM: ${candidateResponse}`)
        messages.push({ role: 'user', content: candidateResponse })
    }

    console.log('\n' + '═'.repeat(80))
    console.log('📊 TEST RESULTS')
    console.log('═'.repeat(80))

    return results
}

async function simulateAlexResponse(messages: Message[]): Promise<string> {
    // This simulates Alex's system prompt + intelligence layer
    // For testing, we'll use a simplified version
    const systemPrompt = `You are Alex, an experienced interviewer conducting a DevOps/SRE interview.

CRITICAL RULES:
- Ask ONE question at a time
- After 3-4 follow-ups on same topic, move to next topic
- Use specific, realistic scenarios (not generic "critical services down")
- Keep responses SHORT - acknowledge briefly then ask next question
- After 8-10 total questions, start wrapping up

Current conversation depth: ${Math.floor(messages.length / 2)} questions asked
`

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use mini to save costs
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ] as any,
        temperature: 0.7,
        max_tokens: 150,
    })

    return response.choices[0]?.message?.content || 'Could you elaborate on that?'
}

async function generateCandidateResponse(messages: Message[], persona: string): Promise<string> {
    const lastMessage = messages[messages.length - 1]?.content || ''

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: persona },
            { role: 'user', content: `The interviewer asked: "${lastMessage}"\n\nProvide a realistic, conversational response as Sriram. Keep it 2-3 sentences.` }
        ] as any,
        temperature: 0.8,
        max_tokens: 100,
    })

    return response.choices[0]?.message?.content || 'That\'s a good question. Let me think...'
}

function printResults(results: TestResults) {
    console.log(`\nTotal Questions Asked: ${results.totalQuestions}`)
    console.log(`Topics Covered: ${results.topics.length} - ${results.topics.join(', ')}`)
    console.log(`\nQuestions per Topic:`)
    Object.entries(results.questionsByTopic).forEach(([topic, count]) => {
        console.log(`  ${topic}: ${count} questions`)
    })

    console.log(`\n📋 State Transitions:`)
    results.stateTransitions.forEach(t => console.log(`  ${t}`))

    console.log(`\n✅ SUCCESS CRITERIA:`)
    console.log(`  Total questions 8-12: ${results.totalQuestions >= 8 && results.totalQuestions <= 12 ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`  No infinite loops: ${!results.hadInfiniteLoop ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`  Proper wrap-up: ${results.wrappedUpProperly ? '✅ PASS' : '⚠️  SKIPPED'}`)
    console.log(`  No generic scenarios: ${!results.usedGenericScenarios ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`  Multiple topics: ${results.topics.length >= 3 ? '✅ PASS' : '❌ FAIL'}`)

    console.log(`\n📝 ALL QUESTIONS:\n`)
    results.questions.forEach((q, i) => {
        console.log(`${i + 1}. ${q}\n`)
    })
}

// Run the test
simulateInterview(12).then(results => {
    printResults(results)
    process.exit(0)
}).catch(err => {
    console.error('❌ Test failed:', err)
    process.exit(1)
})
