/**
 * LLM-Driven State Management
 * 
 * Replaces rule-based interview-brain.ts logic with structured LLM outputs.
 * This makes the interview flow fully dynamic and context-aware.
 */

import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

/**
 * Structured output schema for interview state analysis
 */
const InterviewStateSchema = z.object({
    phase: z.preprocess((val) => String(val).toLowerCase(), z.enum(['introduction', 'topics', 'wrapup'])),
    currentTopic: z.string().nullable().optional(),
    topicsCovered: z.array(z.string()).default([]),
    questionDepth: z.number().min(0).max(5),
    candidateLevel: z.preprocess((val) => String(val).toLowerCase(), z.enum(['entry', 'mid', 'senior', 'architect']).optional()),
    nextAction: z.object({
        action: z.preprocess((val) => String(val).toLowerCase(), z.enum(['continue_topic', 'move_to_next_topic', 'drill_down', 'wrap_up'])),
        topic: z.string().optional(),
        questionType: z.preprocess((val) => String(val).toLowerCase(), z.enum(['definition', 'scenario', 'deep_dive', 'behavioral']).optional()),
        ragQuery: z.string().optional(), // For targeted RAG retrieval
    }),
    candidateProfile: z.object({
        skills: z.array(z.string()).default([]),
        experienceYears: z.number().optional(),
        technologies: z.array(z.string()).default([]),
        strengths: z.array(z.string()).default([]),
        gaps: z.array(z.string()).default([]),
    }).optional().default({
        skills: [],
        technologies: [],
        strengths: [],
        gaps: []
    }),
})

export type InterviewState = z.infer<typeof InterviewStateSchema>

/**
 * Analyze candidate's last turn and determine next interview action
 * This replaces the rule-based logic in interview-brain.ts
 */
export async function analyzeInterviewState(
    conversationHistory: Array<{ role: string; content: string }>,
    sessionContext: {
        packLevel: string
        packRole: string
        jdText?: string
        previousState?: InterviewState
        allowedTopics?: string[]
    }
): Promise<InterviewState> {
    const systemPrompt = `You are an AI system that analyzes interview conversations and determines the next best action.

Your task:
1. Analyze the conversation history
2. Extract candidate information (skills, experience, level)
3. Determine interview phase (introduction, topics, wrapup)
4. Decide the next action (continue topic, move to next, drill down, wrap up)
5. Generate a targeted RAG query if needed for context retrieval

Context:
- Interview Level: ${sessionContext.packLevel}
- Interview Role: ${sessionContext.packRole}
${sessionContext.jdText ? `- Job Description: ${sessionContext.jdText.substring(0, 500)}...` : ''}
${sessionContext.allowedTopics?.length ? `- ALLOWED TOPICS: ${sessionContext.allowedTopics.join(', ')} (You MUST strictly choose from these)` : ''}

Previous State:
${sessionContext.previousState ? JSON.stringify(sessionContext.previousState, null, 2) : 'None (first turn)'}

Return a structured JSON object. You must strictly adhere to the following values:

- phase: One of ["introduction", "topics", "wrapup"]
- currentTopic: Current technical topic being discussed
- topicsCovered: List of topics already covered
- questionDepth: How deep we've gone (0-5, where 0=basic, 5=expert)
- candidateLevel: One of ["entry", "mid", "senior", "architect"]
- nextAction: {
    action: One of ["continue_topic", "move_to_next_topic", "drill_down", "wrap_up"],
    topic: string (optional),
    questionType: One of ["definition", "scenario", "deep_dive", "behavioral"],
    ragQuery: string (optional)
}
- candidateProfile: Extracted candidate information

CRITICAL RULES FOR NEXT ACTION:
1. If the candidate answers the previous question correctly or sufficiently, MOVE ON. Set action to "move_to_next_topic" or "drill_down" into a NEW aspect.
2. Do NOT stay on the same specific question if it was answered.
3. Only use "continue_topic" if the candidate's answer was partial, unclear, or you are building a multi-step scenario.
4. Avoid looping. If you've asked about X twice, force a move to Y.
5. If ALLOWED TOPICS are provided, your 'nextAction.topic' MUST be one of them (or related to them). Do NOT default to generic topics like 'CI/CD' unless listed.

6. For SENIOR/ARCHITECT candidates: NEVER ask definitions (e.g. "What is X?"). Instead, ask "What is your experience with X?" or "Describe how you architected X". Start at Depth 3+.

Be dynamic and adaptive. If the candidate shows deep knowledge, increase depth. If they struggle, provide more foundational questions.`

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10) as any, // Type assertion for Vapi message format
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent state management
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
        throw new Error('Failed to get LLM response for state analysis')
    }

    try {
        const parsed = JSON.parse(content)
        return InterviewStateSchema.parse(parsed)
    } catch (error) {
        console.error('Failed to parse LLM state response:', error)
        // Fallback to default state
        return {
            phase: 'introduction',
            topicsCovered: [],
            questionDepth: 0,
            nextAction: {
                action: 'continue_topic',
                questionType: 'scenario',
            },
            candidateProfile: {
                skills: [],
                technologies: [],
                strengths: [],
                gaps: []
            }
        }
    }
}

/**
 * Generate next question based on analyzed state
 * This uses the state to generate a contextually appropriate question
 */
export async function generateNextQuestion(
    state: InterviewState,
    conversationHistory: Array<{ role: string; content: string }>,
    systemPrompt: string
): Promise<string> {
    const questionPrompt = `Based on the interview state, generate the next question.

Interview State:
${JSON.stringify(state, null, 2)}

Conversation History(last 3 turns):
${conversationHistory.slice(-3).map(t => `${t.role}: ${t.content}`).join('\n')}

Generate a sharp, specific question that:
    1. Matches the questionType: ${state.nextAction.questionType}
    2. Is appropriate for depth level: ${state.questionDepth}
    3. Builds on the conversation naturally.
4. IMPORTANT: If the candidate just answered a similar question, DO NOT ask it again.Pivot to a related trade - off, edge case, or a completely new aspect.
5. If action is "drill_down", challenge their specific implementation details or trade - offs.
6. CONTEXT USAGE: Use any provided "[Official Troubleshooting Guide]" or source material as INSPIRATION. Use the concepts to ground your scenario, but feel free to be creative, conversational, and adapt the question to the flow. Do not be rigid.
7. TECHNICAL DEPTH (NO HR-STYLE): Avoid generic "Tell me about a time..." questions for technical topics. 
   - Ask for ARCHITECTURE: "How do you design the branching strategy for 50 microservices?"
   - Ask for TRADE-OFFS: "Why choose Helm over Kustomize for this?"
   - Ask for SCENARIOS with CONSTRAINTS: "You have 10 minutes to rollback. How do you do it?"
8. TOPIC COHERENCE: Focus on one primary technical domain per question. Do not force unrelated tools together (e.g. Jenkins and Runtime 502 Errors). If asking about a tool, stick to its specific scope.
9. CI/CD MANDATES: When the topic is CI/CD, you MUST ask about: Branching Strategies (GitFlow vs Trunk), Docker Image Versioning strategies (Semantic vs SHA), or Hotfix/Rollback workflows.

Return only the question text, no additional commentary.`

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: questionPrompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
    })

    return response.choices[0]?.message?.content || "Let's continue. Can you elaborate on that?"
}

