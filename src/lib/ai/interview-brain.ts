/**
 * Interview Brain - Dynamic Question Generation System
 * 
 * This system makes Alex behave like a real interviewer:
 * 1. Listens to candidate intro
 * 2. Extracts skills and experience
 * 3. Builds questions progressively (basic → advanced)
 * 4. Follows logical topic flow
 * 5. Drills down based on candidate responses
 */

export interface CandidateIntro {
    skills: string[]
    experience: {
        years?: number
        level?: 'entry' | 'mid' | 'senior' | 'architect'
    }
    technologies: string[]
    tools: string[]
    projects?: string[]
}

export interface InterviewState {
    phase: 'introduction' | 'topics' | 'wrapup'
    currentTopic?: string
    topicsCovered: string[]
    questionDepth: number // 0 = basic, 1-2 = intermediate, 3+ = advanced
    candidateIntro?: CandidateIntro
    lastQuestion?: string
    lastAnswer?: string
    conversationContext: {
        mentionedTechnologies: string[]
        skillLevel: Record<string, 'basic' | 'intermediate' | 'advanced'>
        areasOfInterest: string[]
    }
}

/**
 * Extract candidate information from their introduction
 */
export function extractCandidateIntro(introText: string): CandidateIntro {
    const lower = introText.toLowerCase()
    
    // Extract skills/technologies
    const techKeywords = [
        'kubernetes', 'k8s', 'docker', 'terraform', 'aws', 'azure', 'gcp',
        'jenkins', 'github actions', 'gitlab', 'ci/cd', 'helm', 'ansible',
        'prometheus', 'grafana', 'elk', 'vault', 'consul', 'nginx',
        'istio', 'linkerd', 'kafka', 'redis', 'postgresql', 'mongodb'
    ]
    
    const mentionedTech: string[] = []
    techKeywords.forEach(tech => {
        if (lower.includes(tech)) {
            mentionedTech.push(tech)
        }
    })
    
    // Extract years of experience
    const yearsMatch = lower.match(/(\d+)\s*(?:years?|yrs?|yr)/i)
    const years = yearsMatch ? parseInt(yearsMatch[1]) : undefined
    
    // Infer level from context
    let level: 'entry' | 'mid' | 'senior' | 'architect' | undefined
    if (lower.includes('junior') || lower.includes('entry') || (years && years < 2)) {
        level = 'entry'
    } else if (lower.includes('senior') || lower.includes('lead') || (years && years >= 5)) {
        level = 'senior'
    } else if (lower.includes('architect') || lower.includes('principal')) {
        level = 'architect'
    } else if (years && years >= 2) {
        level = 'mid'
    }
    
    // Extract skills (look for "I work with", "I have experience with", etc.)
    const skills: string[] = []
    const skillPatterns = [
        /(?:I|we|my team)\s+(?:work|worked|use|used|have|had)\s+(?:with|on)\s+([^.,!?]+)/gi,
        /(?:experience|expertise|knowledge)\s+(?:with|in|on)\s+([^.,!?]+)/gi
    ]
    
    skillPatterns.forEach(pattern => {
        const matches = introText.matchAll(pattern)
        for (const match of matches) {
            const skillText = match[1].trim()
            if (skillText.length > 3 && skillText.length < 50) {
                skills.push(skillText)
            }
        }
    })
    
    return {
        skills: [...new Set(skills)],
        experience: { years, level },
        technologies: [...new Set(mentionedTech)],
        tools: [...new Set(mentionedTech)], // Same for now
        projects: []
    }
}

/**
 * Determine topic progression order based on candidate intro
 */
export function getTopicProgression(candidateIntro: CandidateIntro): string[] {
    const priority: string[] = []
    
    // Priority 1: Technologies candidate mentioned
    if (candidateIntro.technologies.some(t => t.includes('kubernetes') || t.includes('k8s'))) {
        priority.push('kubernetes')
    }
    if (candidateIntro.technologies.some(t => t.includes('ci/cd') || t.includes('jenkins') || t.includes('github'))) {
        priority.push('cicd')
    }
    if (candidateIntro.technologies.some(t => t.includes('aws') || t.includes('azure') || t.includes('gcp'))) {
        priority.push('cloud')
    }
    if (candidateIntro.technologies.some(t => t.includes('terraform') || t.includes('iac'))) {
        priority.push('terraform')
    }
    
    // Priority 2: Standard progression (if not mentioned)
    const standardOrder = ['kubernetes', 'cicd', 'deployment', 'terraform', 'cloud']
    standardOrder.forEach(topic => {
        if (!priority.includes(topic)) {
            priority.push(topic)
        }
    })
    
    return priority
}

/**
 * Generate question based on topic, level, and depth
 */
export function generateProgressiveQuestion(
    topic: string,
    level: 'entry' | 'mid' | 'senior' | 'architect',
    depth: number,
    candidateTech: string[],
    previousAnswer?: string
): string {
    // Entry level: Start with definitions and basics
    if (level === 'entry' && depth === 0) {
        return generateEntryLevelQuestion(topic, candidateTech)
    }
    
    // Mid/Senior: Start with scenarios
    if ((level === 'mid' || level === 'senior') && depth === 0) {
        return generateScenarioQuestion(topic, candidateTech, 'intermediate')
    }
    
    // Drill down based on previous answer
    if (previousAnswer && depth > 0) {
        return generateDrillDownQuestion(topic, previousAnswer, depth, candidateTech)
    }
    
    // Default: scenario-based
    return generateScenarioQuestion(topic, candidateTech, depth > 2 ? 'advanced' : 'intermediate')
}

/**
 * Entry level: Start with foundational questions
 */
function generateEntryLevelQuestion(topic: string, candidateTech: string[]): string {
    const tech = candidateTech[0] || topic
    
    const questions: Record<string, string[]> = {
        kubernetes: [
            `What are the different types of services available in Kubernetes?`,
            `If I want to expose an application outside of Kubernetes, how can I do that?`,
            `What's the difference between a Deployment and a StatefulSet?`,
            `How do you scale a Kubernetes application?`
        ],
        cicd: [
            `What is CI/CD and why is it important?`,
            `Walk me through a typical CI/CD pipeline.`,
            `What happens when a CI/CD pipeline fails?`
        ],
        cloud: [
            `What is a VPC and why do we need it?`,
            `How do you secure network traffic in the cloud?`,
            `What's the difference between public and private subnets?`
        ],
        terraform: [
            `What is Infrastructure as Code?`,
            `How does Terraform manage state?`,
            `What happens when you run terraform apply?`
        ]
    }
    
    const topicQuestions = questions[topic] || questions.kubernetes
    return topicQuestions[Math.floor(Math.random() * topicQuestions.length)]
}

/**
 * Scenario-based questions (mid/senior level)
 */
function generateScenarioQuestion(
    topic: string,
    candidateTech: string[],
    difficulty: 'intermediate' | 'advanced'
): string {
    const tech = candidateTech[0] || topic
    
    const scenarios: Record<string, Record<string, string[]>> = {
        kubernetes: {
            intermediate: [
                `Your ${tech} pods are stuck in Pending state. Walk me through your debugging process.`,
                `You need to expose a service outside the cluster. What options do you have?`,
                `Your application needs to scale based on CPU usage. How would you configure this?`
            ],
            advanced: [
                `Your ${tech} cluster nodes are being terminated unexpectedly during peak traffic. How do you debug and resolve this?`,
                `You're seeing network connectivity issues between pods across different namespaces. How do you troubleshoot?`,
                `Your StatefulSet is experiencing data corruption. Walk me through your recovery process.`
            ]
        },
        cicd: {
            intermediate: [
                `Your CI/CD pipeline is failing during the deployment stage. How do you debug this?`,
                `A production deployment failed halfway through rollout. How do you handle this?`
            ],
            advanced: [
                `Your CI/CD system is down and blocking all deployments. How do you restore service?`,
                `A security scan in your pipeline is blocking a critical hotfix. How do you proceed?`
            ]
        },
        cloud: {
            intermediate: [
                `You need to set up networking between two VPCs in different regions. How would you do this?`,
                `Your application needs cross-region encryption. Walk me through your approach.`
            ],
            advanced: [
                `You're experiencing network latency between regions. How do you optimize this?`,
                `Your multi-region setup needs disaster recovery. How do you design this?`
            ]
        }
    }
    
    const topicScenarios = scenarios[topic]?.[difficulty] || scenarios.kubernetes.intermediate
    return topicScenarios[Math.floor(Math.random() * topicScenarios.length)]
}

/**
 * Drill down questions based on previous answer
 */
function generateDrillDownQuestion(
    topic: string,
    previousAnswer: string,
    depth: number,
    candidateTech: string[]
): string {
    const lower = previousAnswer.toLowerCase()
    const tech = candidateTech[0] || topic
    
    // If they mentioned a specific solution, drill into it
    if (lower.includes('ingress') || lower.includes('ingress controller')) {
        return `You mentioned using an ingress controller. What happens if the ingress controller itself fails? How do you ensure high availability?`
    }
    
    if (lower.includes('load balancer') || lower.includes('alb') || lower.includes('nlb')) {
        return `Good. Now, if you're using a load balancer, how do you handle SSL/TLS termination? What about certificate management?`
    }
    
    if (lower.includes('service') || lower.includes('clusterip')) {
        return `You mentioned using a Service. What's the difference between ClusterIP, NodePort, and LoadBalancer? When would you use each?`
    }
    
    if (lower.includes('hpa') || lower.includes('horizontal pod autoscaler')) {
        return `You mentioned HPA. How does HPA decide when to scale? What metrics does it use? What if the metrics are delayed?`
    }
    
    if (lower.includes('vpc') || lower.includes('virtual private cloud')) {
        return `You mentioned VPC. How do you handle cross-region communication? What about encryption in transit?`
    }
    
    // Generic drill-down
    if (depth === 1) {
        return `Good. Now, let's say that solution fails. What's your backup plan? How do you ensure reliability?`
    }
    
    if (depth === 2) {
        return `What about edge cases? What happens under high load? How do you handle failures?`
    }
    
    if (depth >= 3) {
        return `Let's go deeper. What are the trade-offs of that approach? What are the limitations? How would you improve it?`
    }
    
    // Default: ask for more detail
    return `Can you elaborate on that? Walk me through the specific steps.`
}

/**
 * Determine next question based on interview state
 */
export function getNextQuestion(state: InterviewState): {
    question: string
    topic: string
    depth: number
} {
    const { phase, currentTopic, topicsCovered, questionDepth, candidateIntro, lastAnswer } = state
    
    if (phase === 'introduction') {
        // Ask for intro
        return {
            question: "To get started, could you give me a brief overview of your background? I'd like to hear about your years of experience, your current role, and the key technologies and tools you've worked with.",
            topic: 'introduction',
            depth: 0
        }
    }
    
    if (!candidateIntro || candidateIntro.technologies.length === 0) {
        // Fallback if no intro extracted
        return {
            question: "Could you tell me about your experience with Kubernetes or container orchestration?",
            topic: 'kubernetes',
            depth: 0
        }
    }
    
    // Determine topic progression
    const topicProgression = getTopicProgression(candidateIntro)
    const currentTopicIndex = currentTopic ? topicProgression.indexOf(currentTopic) : -1
    
    // If we've asked 3+ questions on current topic, move to next
    if (questionDepth >= 3 && currentTopic) {
        const nextTopicIndex = currentTopicIndex + 1
        if (nextTopicIndex < topicProgression.length) {
            const nextTopic = topicProgression[nextTopicIndex]
            return {
                question: generateProgressiveQuestion(
                    nextTopic,
                    candidateIntro.experience.level || 'mid',
                    0,
                    candidateIntro.technologies
                ),
                topic: nextTopic,
                depth: 0
            }
        }
    }
    
    // Continue drilling down on current topic
    const topic = currentTopic || topicProgression[0]
    const level = candidateIntro.experience.level || 'mid'
    
    return {
        question: generateProgressiveQuestion(
            topic,
            level,
            questionDepth,
            candidateIntro.technologies,
            lastAnswer
        ),
        topic,
        depth: questionDepth
    }
}

