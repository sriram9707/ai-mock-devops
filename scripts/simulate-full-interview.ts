
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { analyzeInterviewState, generateNextQuestion } from '../src/lib/ai/llm-state-manager'
import { retrieveCategoryScenarios } from '../src/lib/retrieval-service'
import { INTERVIEW_TOPICS } from '../src/lib/ai/interview-flow'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

async function runSimulation() {
    console.log('🚀 Starting Interview Simulation (Inspiration Mode)...\n')

    // 1. Setup Context
    // Testing Ingested GitHub Actions Content
    const selectedTopics = ['cicd']
    console.log(`📌 Selected Topics for GH Actions: ${selectedTopics.join(', ')}`)

    // Emulate retrieval - Query specific to the new file content
    const ragScenarios = await retrieveCategoryScenarios('devops-engineer', 'senior', ['github-actions', 'cicd'])

    // Construct System Prompt (Simplified from route.ts)
    const systemPromptBase = `You are Alex, an expert Senior DevOps Interviewer.
    
    Current Interview Context:
    - Candidate Level: Senior
    - Role: DevOps Engineer
    - Topics: ${selectedTopics.join(', ')}

    JOB DESCRIPTION (USER PROVIDED):
    "Strong knowledge of DevOps principles, practices, and methodologies.
    Scripting languages: shell scripting, LINUX.
    Proficiency in tools such as Jenkins, Docker, Sonar Quebe, NEXUS, Kubernetes, Git, and configuration management tools like Ansible.
    Familiarity with cloud platforms such as AWS.
    Solid understanding of networking, security, and infrastructure concepts.
    Excellent problem-solving skills and the ability to work collaboratively with cross-functional teams.
    Strong communication skills to effectively convey technical concepts to both technical and non-technical stakeholders."
    
    OFFICIAL TROUBLESHOOTING GUIDE (RAG CONTEXT):
    ${ragScenarios.map(s => `
    TOPIC: ${s.category}
    SCENARIOS: ${s.scenarios.join('\n\n')}
    `).join('\n')}
    
    INSTRUCTIONS:
    - Use the provided Context as INSPIRATION.
    - PRIORITIZE the JOB DESCRIPTION requirements.
    - Be conversational.
    - Start with a scenario.
    `
    // Note: analyzeInterviewState uses its own internal system prompt, but generateNextQuestion takes custom one.
    // Actually, analyzeInterviewState receives messages history.

    const history: Array<{ role: string; content: string }> = []

    console.log(`\n💬 INITIAL HISTORY: ${history.length} turns`)

    for (let i = 0; i < 2; i++) {
        console.log(`\n--- TURN ${i + 1} ---`)

        // 1. Analyze State
        const state = await analyzeInterviewState(history, {
            packLevel: 'senior',
            packRole: 'devops-engineer',
            allowedTopics: selectedTopics
        })
        // Force topic for verification - REMOVED for dynamic flow
        // state.nextAction.topic = 'Linux System Internals'

        console.log(`🧠 State Analysis: Phase=${state.currPhase || 'N/A'}, Action=${state.nextAction.action}, Topic=${state.nextAction.topic}`)

        // 2. Generate Question
        // Pass the RAG-enriched system prompt
        const alexQuestion = await generateNextQuestion(state, history, systemPromptBase)
        console.log(`🤖 ALEX: ${alexQuestion}`)

        // 3. Update History
        history.push({ role: 'assistant', content: alexQuestion })

        // 4. Mock Candidate Answer (Simulated using LLM for variety)
        const candidateResponse = await generateMockCandidateAnswer(alexQuestion)
        console.log(`👤 CANDIDATE: ${candidateResponse}`)

        history.push({ role: 'user', content: candidateResponse })
    }

    console.log('\n--- SIMULATION ENDED ---\n')

    // GENERATE FEEDBACK
    console.log('📝 Generating Feedback Summary...')
    await generateFeedbackSummary(history)
}

async function generateMockCandidateAnswer(question: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a Senior DevOps Engineer candidate. Answer the interview question concisely but with some technical detail. Occasionally mention a tool like kubectl or Terraform.' },
            { role: 'user', content: question }
        ]
    })
    return response.choices[0]?.message?.content || "I'm not sure."
}

// Simplified version of scoring.ts logic for simulation output
async function generateFeedbackSummary(history: { role: string, content: string }[]) {
    // We reuse the huge prompt from scoring.ts (copy-pasted partially for brevity or imported?)
    // Importing 'scoreInterview' is hard because it needs DB. 
    // I will just use a simplified prompt here to show the user "What feedback looks like".

    const prompt = `Analyze this interview transcript and provide feedback.
    
    TRANSCRIPT:
    ${history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
    
    Return a structured JSON with:
    - strengths: string[]
    - improvements: string[]
    - feedback: string (summary)
    - overallScore: number
    `

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    })

    console.log(response.choices[0]?.message?.content)
}

runSimulation().catch(console.error)
