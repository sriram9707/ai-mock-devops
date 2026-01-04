'use server'

import OpenAI from 'openai'
import prisma from '@/lib/prisma'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

interface ScoringRubric {
    technicalCompetencies: Record<string, number> // Topic scores out of 10
    // NEW: Detailed breakdown for each topic
    topicBreakdown: {
        topic: string
        overallScore: number
        subTopics: {
            name: string
            score: number
            assessment: 'strong' | 'adequate' | 'weak'
            evidence: string // What they said/did
            feedback: string // Specific feedback for this sub-topic
        }[]
        keyStrengths: string[] // What they did well in this topic
        keyWeaknesses: string[] // What they struggled with
        resources: string[] // Specific upskilling resources for this topic
    }[]
    softSkills: {
        behavioral: number
        thinking: number
        communication: number
        problemSolving: number
    }
    // Senior DevOps Evaluation Dimensions
    seniorDevOpsDimensions: {
        architecturalReasoning: number // System thinking, SPOF identification, blast radius
        strategicTradeoffs: number // Business alignment, team/budget/timeline considerations
        incidentManagement: number // Unknown incidents, stakeholder communication, MTTR, error budgets
        operationalExcellence: number // FinOps, security, governance, cost optimization
    }
    // Seniority Gap Analysis
    seniorityGap: {
        toolMastery: 'medior' | 'senior' | 'borderline'
        automation: 'medior' | 'senior' | 'borderline'
        impact: 'medior' | 'senior' | 'borderline'
        communication: 'medior' | 'senior' | 'borderline'
    }
    overallScore: number // Weighted average
    strengths: string[]
    improvements: string[]
    feedback: string
    upskillingPlan: {
        weeks: number
        focus_areas: string[]
    }
}


/**
 * Score an interview session based on all turns and rubric criteria
 */
export async function scoreInterview(sessionId: string, previousResult?: any): Promise<ScoringRubric> {
    // Get all interview turns
    const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
            turns: {
                orderBy: { createdAt: 'asc' }
            },
            pack: true,
            user: {
                include: { profile: true }
            }
        }
    })

    if (!session || !session.pack) {
        throw new Error('Session not found')
    }

    // Check if interview has sufficient responses to score
    const userTurns = session.turns.filter(turn => turn.role === 'user')

    if (userTurns.length < 2) {
        // Not enough user responses to score properly
        return {
            technicalCompetencies: {
                "Kubernetes/OpenShift": 0,
                "CI/CD Tools": 0,
                "Deployment Strategy": 0,
                "Helm Charts": 0,
                "Terraform": 0,
                "Cloud Provider Services": 0
            },
            topicBreakdown: [], // Empty for incomplete interviews
            softSkills: {
                behavioral: 0,
                thinking: 0,
                communication: 0,
                problemSolving: 0
            },
            seniorDevOpsDimensions: {
                architecturalReasoning: 0,
                strategicTradeoffs: 0,
                incidentManagement: 0,
                operationalExcellence: 0
            },
            seniorityGap: {
                toolMastery: 'medior',
                automation: 'medior',
                impact: 'medior',
                communication: 'medior'
            },
            overallScore: 0,
            strengths: [],
            improvements: ["Interview was incomplete - insufficient responses provided"],
            feedback: `Interview ended prematurely with only ${userTurns.length} user response(s). Please ensure your microphone is working and that you're answering the interviewer's questions. Try again with a working audio setup.`,
            upskillingPlan: {
                weeks: 0,
                focus_areas: ["Complete a full interview session"]
            }
        }
    }

    // Build conversation history
    const conversationHistory = session.turns.map(turn => ({
        role: turn.role === 'interviewer' ? 'assistant' : 'user',
        content: turn.message
    }))

    // Build context string for previous result if available
    let retakeContext = ''
    if (previousResult) {
        try {
            const prevScores = JSON.parse(previousResult.competencyScores)
            const prevImprovements = JSON.parse(previousResult.improvements)

            retakeContext = `
PREVIOUS SESSION CONTEXT (RETAKE):
- Previous Overall Score: ${previousResult.overallScore}
- Previous Performance: The candidate previously scored ${previousResult.overallScore}/100.
- Previous Weaknesses: ${prevImprovements.join(', ')}

COMPARISON TASK:
- You MUST explicitly compare their current performance to their previous session.
- Did they address the "Previous Weaknesses"?
- Mention "Improved", "Regressed", or "Stagnant" in the feedback.
`
        } catch (e) {
            console.error('Failed to parse previous result for context', e)
        }
    }

    // Build scoring prompt
    const scoringPrompt = `You are a STRICT technical interviewer evaluating a DevOps/SRE interview. You must be HONEST and ACCURATE in your assessment.

INTERVIEW CONTEXT:
- Role: ${session.pack.role} - ${session.pack.level}
- Interview Type: ${session.pack.title}
- Total Turns: ${session.turns.length}
${retakeContext}

CONVERSATION HISTORY:
${conversationHistory.map((msg, idx) => `${idx + 1}. ${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

CRITICAL EVALUATION RULES:
1. **PENALIZE WRONG ANSWERS**: If the candidate gives incorrect technical information, significantly lower their score
2. **REWARD CORRECT ANSWERS**: Only give high scores for demonstrably correct technical knowledge
3. **BE STRICT**: A score of 7-8 means they got MOST things right, not just participated
4. **NO PARTICIPATION TROPHIES**: Simply answering doesn't mean they answered correctly

EVALUATION RUBRIC (BE STRICT):
Score each competency out of 10, where:
- 9-10: Exceptional (expert-level, demonstrates deep understanding, answers are CORRECT and COMPREHENSIVE)
- 7-8: Strong (solid knowledge, MOST answers are correct, minor gaps or inaccuracies)
- 5-6: Adequate (basic understanding, SOME correct answers but also WRONG answers, significant gaps)
- 3-4: Weak (MOSTLY WRONG answers, significant technical errors, demonstrates lack of understanding)
- 1-2: Poor (consistently WRONG answers, fundamental misunderstandings, cannot answer basic questions correctly)

**IMPORTANT**: 
- If they gave wrong technical information, score them 3-6 (not 7-8)
- If they couldn't answer questions correctly, score them 1-4
- Only score 7+ if they demonstrated CORRECT technical knowledge
- Participation alone does NOT warrant a passing score

TECHNICAL COMPETENCIES (Score each - BE STRICT):
For each topic, evaluate:
- Did they give CORRECT technical answers?
- Did they demonstrate REAL understanding or just guessing?
- Were their solutions technically sound?
- Did they make technical errors?

1. Kubernetes/OpenShift: 
   - Did they give CORRECT answers about K8s incidents?
   - Were their debugging steps technically accurate?
   - Score LOW (3-5) if they gave wrong commands, incorrect concepts, or couldn't answer

2. CI/CD Tools:
   - Did they understand CI/CD correctly?
   - Were their pipeline troubleshooting steps correct?
   - Score LOW if they showed fundamental misunderstandings

3. Deployment Strategy:
   - Did they demonstrate correct knowledge of deployment patterns?
   - Were their strategies technically sound?
   - Score LOW for incorrect deployment approaches

4. Helm Charts:
   - Did they show correct Helm knowledge?
   - Were their solutions accurate?
   - Score LOW for wrong Helm concepts

5. Terraform:
   - Did they understand IaC correctly?
   - Were their Terraform solutions technically correct?
   - Score LOW for incorrect state management or IaC concepts

6. Cloud Provider Services:
   - Did they demonstrate correct cloud knowledge?
   - Were their cloud solutions accurate?
   - Score LOW for wrong cloud service usage

# TOPIC-BY-TOPIC BREAKDOWN (REQUIRED)

For EACH technical competency, you MUST provide a detailed breakdown of sub-topics:

**Format for each topic:**
{
  "topic": "Kubernetes/OpenShift",
  "overallScore": 7.5,
  "subTopics": [
    {
      "name": "Pod Lifecycle & Debugging",
      "score": 9,
      "assessment": "strong",
      "evidence": "Correctly identified 'kubectl describe pod, logs, events' troubleshooting sequence",
      "feedback": "Excellent debugging methodology. Showed understanding of pod states."
    },
    {
      "name": "Secret Management",
      "score": 4,
      "assessment": "weak",
      "evidence": "Suggested storing secrets in ConfigMaps, which is insecure",
      "feedback": "Critical error - secrets should use Kubernetes Secrets with encryption at rest, or external solutions like HashiCorp Vault. Study: kubernetes.io/docs/concepts/configuration/secret/"
    },
    {
      "name": "Networking (Services/Ingress)",
      "score": 5,
      "assessment": "adequate",
      "evidence": "Understood ClusterIP vs NodePort but couldn't explain Ingress routing",
      "feedback": "Basic service networking understood. Improve: Study Ingress controllers and path-based routing. Resource: kubernetes.io/docs/concepts/services-networking/ingress/"
    }
  ],
  "keyStrengths": ["Pod debugging", "Understanding pod lifecycle"],
  "keyWeaknesses": ["Secret management security", "Advanced networking (Ingress)"],
  "resources": [
    "Kubernetes Secrets best practices: kubernetes.io/docs/concepts/configuration/secret/",
    "Ingress deep dive: kubernetes.io/docs/concepts/services-networking/ingress/"
  ]
}

**REQUIRED for ALL 6 technical competencies:**
1. Kubernetes/OpenShift - Break down into: Pod Lifecycle, Deployments, Secrets, ConfigMaps, Networking, RBAC
2. CI/CD Tools - Break down into: Pipeline Design, Testing Integration, Artifact Management, Security Scanning
3. Deployment Strategy - Break down into: Blue/Green, Canary, Rolling Updates, Rollback Strategies
4. Helm Charts - Break down into: Templating, Values Management, Chart Structure, Security
5. Terraform - Break down into: State Management, Modules, Providers, Security Best Practices
6. Cloud Provider Services - Break down into: Compute, Storage, Networking, Security, Cost Optimization

# SENIOR DEVOPS EVALUATION DIMENSIONS (Score each out of 10)

## 1. Architectural Reasoning (The "System Thinker")
**Medior Level**: Can implement a design given to them (e.g., "Set up a 3-tier AWS VPC")
**Senior Level**: Can justify the design and identify single points of failure

**Scoring**:
- 1-4 (Medior): Focuses on syntax and tool-specific features. Doesn't discuss risks or failure modes.
- 5-7 (Borderline): Mentions some risks but doesn't deeply analyze failure scenarios.
- 8-10 (Senior): Discusses Blast Radius, State Management, Regional Failover strategies, Single Points of Failure.

**AI Logic Check**: Did the candidate mention "Single Region" risks, "Data Consistency" during failover, "Blast Radius", or "State Management"?

## 2. Strategic Trade-offs (The "Business Alignment")
**Medior Level**: Chooses the "best" technical tool regardless of context
**Senior Level**: Chooses the tool that fits the Team, Budget, and Timeline

**Scoring**:
- 1-4 (Medior): "We should use Service Mesh because it's industry standard" (no context consideration)
- 5-7 (Borderline): Mentions some trade-offs but doesn't deeply analyze team/budget impact
- 8-10 (Senior): "Service Mesh adds 20% operational overhead; for a team of 5, we should stick to simple Load Balancers until we hit X scale"

**AI Logic Check**: Did they mention "Operational Overhead", "Learning Curve", "Team Size", "Budget Constraints", or "Timeline"?

## 3. Incident Management & Chaos (The "Principal SRE")
**Medior Level**: Follows a runbook to fix a known error
**Senior Level**: Handles the "Unknown" and manages the Human Element

**Scoring**:
- 1-4 (Medior): Just describes the technical fix (e.g., "I restarted the pod"). No mention of process or communication.
- 5-7 (Borderline): Mentions some process but doesn't discuss stakeholder management or prevention
- 8-10 (Senior): Discusses Stakeholder Communication, Blameless Post-mortems, "Prevention-by-Design", MTTR, Error Budgets

**AI Logic Check**: Did they talk about "MTTR" (Mean Time to Recovery), "Error Budgets", "Post-mortem", "Stakeholder Communication", or "Blameless Culture"?

## 4. Operational Excellence (The "FinOps & Security")
**Medior Level**: Focuses on making it work
**Senior Level**: Focuses on making it Scalable, Secure, and Cheap

**Scoring**:
- 1-4 (Medior): "I'll use the largest instance size to ensure it doesn't crash" (no cost/security consideration)
- 5-7 (Borderline): Mentions cost or security but doesn't deeply discuss governance or optimization
- 8-10 (Senior): Discusses Right-sizing, Reserved Instances, Policy-as-Code (OPA/Kyverno), Governance, Cost-Optimization, Security Drift Prevention

**AI Logic Check**: Did they use the word "Governance", "Cost-Optimization", "Right-sizing", "Policy-as-Code", or "Security Drift"?

# TRADITIONAL SOFT SKILLS (Score each out of 10 - but technical correctness matters more):
1. Behavioral: How did they handle pressure? Did they ask clarifying questions? Were they collaborative?
   - BUT: If they gave wrong answers confidently, this doesn't help their score much

2. Thinking: How structured was their approach? Did they think systematically?
   - BUT: Structured thinking with WRONG answers is still wrong

3. Communication: Could they explain complex incidents clearly? Were they concise?
   - BUT: Clear communication of WRONG information doesn't warrant high scores

4. Problem-Solving: How did they approach problems? Did they break them down? Consider edge cases?
   - BUT: Good problem-solving process with WRONG solutions is still wrong

# FEEDBACK GENERATION REQUIREMENTS

**CRITICAL**: Your feedback must be EVIDENCE-BASED with SPECIFIC EXAMPLES from the interview.

**Strengths** (3-5 items):
Format: "[Competency Area]: When discussing [topic], the candidate correctly [what they did right]. This demonstrates [why it's a strength]."
Example: "Kubernetes Debugging: When asked about crashlooping pods, they correctly identified the troubleshooting sequence: 'kubectl describe pod, then kubectl logs, then check events'. This demonstrates solid debugging methodology."

**Improvements** (2-4 items):
Format: "[Competency Area]: When asked about [topic], they stated '[quote or paraphrase]', which is incorrect. The correct approach is [correct answer]. Actionable step: [specific practice task with resource]."
Example: "Terraform State: They said 'I'd commit terraform.tfstate to Git', which is a critical security error. State files contain secrets and should use remote backends (S3 + DynamoDB). Practice: Complete HashiCorp's 'Remote State' tutorial."

**Feedback Paragraph** (2-4 sentences):
- Summarize overall performance
- Mention 1-2 specific strong areas with brief evidence
- Mention 1-2 specific weak areas with brief evidence
- If retake: MUST explicitly state "Improved", "Regressed", or "Stagnant" with comparison

Example: "Strong performance in Kubernetes troubleshooting, correctly identifying pod lifecycle issues and debugging commands. However, significant gaps in Terraform best practices, particularly remote state management and IaC security. When asked about state storage, incorrectly suggested committing state to Git instead of using remote backends."

**Upskilling Plan**:
- Must provide week-by-week breakdown
- Each week must have 3-4 specific tasks
- Tasks must be actionable (e.g., "Deploy an EKS cluster using Terraform").
- RESOURCE CITATION REQUIRED: For every item, verify existing official documentation (Kubernetes.io, AWS Docs, Terraform Registry) and provide the Exact Search Term or URL path (e.g., "kubernetes.io/docs/concepts/workloads/pods/").
- DO NOT invent URLs. If unsure, use "Search Official Docs for [Term]".

Return ONLY valid JSON in this exact format:
{
  "technicalCompetencies": {
    "Kubernetes/OpenShift": 8.0,
    "CI/CD Tools": 7.5,
    "Deployment Strategy": 7.0,
    "Helm Charts": 7.5,
    "Terraform": 8.5,
    "Cloud Provider Services": 8.0
  },
  "topicBreakdown": [
    {
      "topic": "Kubernetes/OpenShift",
      "overallScore": 8.0,
      "subTopics": [
        {
          "name": "Pod Lifecycle & Debugging",
          "score": 9,
          "assessment": "strong",
          "evidence": "Correctly identified 'kubectl describe pod, logs, events' sequence",
          "feedback": "Excellent debugging methodology showing deep understanding of pod states and troubleshooting."
        },
        {
          "name": "Secret Management",
          "score": 4,
          "assessment": "weak",
          "evidence": "Suggested storing secrets in ConfigMaps",
          "feedback": "Critical error - use Kubernetes Secrets with encryption or Vault. Study: kubernetes.io/docs/concepts/configuration/secret/"
        }
      ],
      "keyStrengths": ["Pod debugging", "Understanding pod lifecycle"],
      "keyWeaknesses": ["Secret management security"],
      "resources": ["kubernetes.io/docs/concepts/configuration/secret/"]
    }
  ],
  "softSkills": {
    "behavioral": 7.5,
    "thinking": 8.0,
    "communication": 7.5,
    "problemSolving": 8.0
  },
  "seniorDevOpsDimensions": {
    "architecturalReasoning": 8.5,
    "strategicTradeoffs": 7.0,
    "incidentManagement": 8.0,
    "operationalExcellence": 7.5
  },
  "seniorityGap": {
    "toolMastery": "senior",
    "automation": "medior",
    "impact": "senior",
    "communication": "borderline"
  },
  "overallScore": 77.5,
  "strengths": [
    "Kubernetes Debugging: When asked about crashlooping pods, correctly identified 'kubectl describe, logs, then events'. Demonstrates solid troubleshooting methodology.",
    "CI/CD Pipeline Design: Accurately described multi-stage pipeline with proper testing gates and artifact management.",
    "Incident Response: Mentioned stakeholder communication and blameless postmortems, showing senior-level thinking."
  ],
  "improvements": [
    "Terraform State Management: Stated 'I'd commit state to Git' - critical error. Use remote backends (S3+DynamoDB). Practice: Complete terraform.io/docs/language/state/remote tutorial.",
    "Helm Chart Security: Did not mention image scanning or RBAC. Study: Helm security best practices documentation.",
    "Cost Optimization: Focused only on performance, missed right-sizing discussion. Read: AWS Well-Architected Cost Optimization pillar."
  ],
  "feedback": "Strong Kubernetes troubleshooting skills evident when solving the crashloop scenario, correctly identifying debugging sequence and pod lifecycle concepts. However, critical gaps in Terraform security - incorrectly suggested committing state files to Git instead of using remote backends. Also missed cost optimization considerations when discussing infrastructure design.",
  "upskillingPlan": {
    "weeks": 4,
    "focus_areas": [
      "Week 1: Terraform State & Security - Complete HashiCorp Terraform Associate certification modules on state management. Practice: Set up S3 backend with DynamoDB locking. Read: Terraform security best practices guide.",
      "Week 2: Cost Optimization - Study AWS Well-Architected Cost Optimization pillar. Practice: Analyze current infrastructure for right-sizing opportunities. Use AWS Cost Explorer to identify waste.",
      "Week 3: Helm Security - Review Helm security documentation. Practice: Implement image scanning in CI/CD pipeline. Add RBAC policies to Helm charts.",
      "Week 4: Integration Practice - Build end-to-end pipeline: Terraform (remote state) + Helm (secured charts) + cost monitoring. Document trade-offs and security considerations."
    ]
  }
}

**SENIORITY GAP ANALYSIS**:
For each dimension, classify as:
- "medior": Shows medior-level thinking (syntax-focused, no trade-offs, just technical fixes)
- "senior": Shows senior-level thinking (system thinking, trade-offs, business alignment, governance)
- "borderline": Shows some senior traits but inconsistent

**Tool Mastery**: 
- Medior: Knows CLI/syntax
- Senior: Knows internals & limits

**Automation**:
- Medior: Writes scripts
- Senior: Builds platforms (IDPs)

**Impact**:
- Medior: Solves the ticket
- Senior: Improves DORA metrics

**Communication**:
- Medior: Explains the "How"
- Senior: Translates to "Business Value"

Calculate overallScore as weighted average (OUT OF 100, NOT 10):
- Technical competencies: 40% weight (average of all 6, then multiply by 10)
- Senior DevOps Dimensions: 40% weight (average of all 4, then multiply by 10)
- Soft skills: 20% weight (average of all 4, then multiply by 10)
- Formula: overallScore = (techAvg * 0.4 + seniorAvg * 0.4 + softAvg * 0.2) * 10
- Example: If techAvg = 7.5, seniorAvg = 8.0, softAvg = 7.0, then overallScore = (7.5 * 0.4 + 8.0 * 0.4 + 7.0 * 0.2) * 10 = 76.0

IMPORTANT: overallScore must be between 0-100, not 0-10.

Return ONLY the JSON object, no markdown, no explanation.`

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are a JSON parser. Return only valid JSON, no markdown formatting, no explanations.'
                },
                {
                    role: 'user',
                    content: scoringPrompt
                }
            ],
            temperature: 0.1, // Lower temperature for more consistent, strict scoring
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        const scored = JSON.parse(content) as ScoringRubric

        // Validate scores are in range
        const validateScore = (score: number, name: string) => {
            if (score < 0 || score > 10) {
                console.warn(`Invalid score for ${name}: ${score}, clamping to valid range`)
                return Math.max(0, Math.min(10, score))
            }
            return score
        }

        // Validate and clamp all scores
        Object.keys(scored.technicalCompetencies).forEach(key => {
            scored.technicalCompetencies[key] = validateScore(scored.technicalCompetencies[key], key)
        })

        Object.keys(scored.softSkills).forEach(key => {
            scored.softSkills[key as keyof typeof scored.softSkills] = validateScore(
                scored.softSkills[key as keyof typeof scored.softSkills],
                key
            )
        })

        // Recalculate overall score if needed
        // Convert from 0-10 scale to 0-100 scale
        const techAvg = Object.values(scored.technicalCompetencies).reduce((a, b) => a + b, 0) / Object.keys(scored.technicalCompetencies).length
        const softAvg = Object.values(scored.softSkills).reduce((a, b) => a + b, 0) / Object.keys(scored.softSkills).length

        // Calculate senior DevOps dimensions average
        const seniorAvg = scored.seniorDevOpsDimensions
            ? Object.values(scored.seniorDevOpsDimensions).reduce((a, b) => a + b, 0) / Object.keys(scored.seniorDevOpsDimensions).length
            : techAvg // Fallback to techAvg if not provided

        // Weighted average: Technical 40%, Senior Dimensions 40%, Soft Skills 20%
        // Multiply by 10 to convert from 0-10 to 0-100 scale
        scored.overallScore = Math.round((techAvg * 0.4 + seniorAvg * 0.4 + softAvg * 0.2) * 10)

        // Ensure seniorityGap exists (fallback if LLM didn't provide it)
        if (!scored.seniorityGap) {
            // Infer from senior DevOps dimensions scores
            const inferSeniority = (score: number): 'medior' | 'senior' | 'borderline' => {
                if (score >= 8) return 'senior'
                if (score >= 5) return 'borderline'
                return 'medior'
            }

            scored.seniorityGap = {
                toolMastery: inferSeniority(techAvg),
                automation: inferSeniority(seniorAvg),
                impact: inferSeniority(seniorAvg),
                communication: inferSeniority(softAvg)
            }
        }

        return scored
    } catch (error) {
        console.error('Error scoring interview:', error)
        // Fallback to basic scoring
        return {
            technicalCompetencies: {
                "Kubernetes/OpenShift": 7.0,
                "CI/CD Tools": 7.0,
                "Deployment Strategy": 7.0,
                "Helm Charts": 7.0,
                "Terraform": 7.0,
                "Cloud Provider Services": 7.0
            },
            topicBreakdown: [], // Empty fallback - LLM failed to generate
            softSkills: {
                behavioral: 7.0,
                thinking: 7.0,
                communication: 7.0,
                problemSolving: 7.0
            },
            seniorDevOpsDimensions: {
                architecturalReasoning: 7.0,
                strategicTradeoffs: 7.0,
                incidentManagement: 7.0,
                operationalExcellence: 7.0
            },
            seniorityGap: {
                toolMastery: 'borderline',
                automation: 'borderline',
                impact: 'borderline',
                communication: 'borderline'
            },
            overallScore: 70.0,
            strengths: ["Participated in interview"],
            improvements: ["Continue practicing"],
            feedback: "Interview completed. Continue practicing to improve.",
            upskillingPlan: {
                weeks: 2,
                focus_areas: ["General practice"]
            }
        }
    }
}

