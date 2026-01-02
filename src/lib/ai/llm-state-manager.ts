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
    phase: z.enum(['introduction', 'topics', 'wrapup']),
    currentTopic: z.string().optional(),
    topicsCovered: z.array(z.string()).default([]),
    questionDepth: z.number().min(0).max(5),
    candidateLevel: z.enum(['entry', 'mid', 'senior', 'architect']).optional(),
    nextAction: z.object({
        action: z.enum(['continue_topic', 'move_to_next_topic', 'drill_down', 'wrap_up']),
        topic: z.string().optional(),
        questionType: z.enum(['definition', 'scenario', 'deep_dive', 'behavioral']).optional(),
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

Previous State:
${sessionContext.previousState ? JSON.stringify(sessionContext.previousState, null, 2) : 'None (first turn)'}

Return a structured JSON object with:
- phase: Current interview phase
- currentTopic: Current technical topic being discussed
- topicsCovered: List of topics already covered
- questionDepth: How deep we've gone (0-5, where 0=basic, 5=expert)
- candidateLevel: Inferred candidate level
- nextAction: What to do next (action, topic, questionType, ragQuery)
- candidateProfile: Extracted candidate information

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

Conversation History (last 3 turns):
${conversationHistory.slice(-3).map(t => `${t.role}: ${t.content}`).join('\n')}

Generate a natural, conversational question that:
1. Matches the questionType: ${state.nextAction.questionType}
2. Is appropriate for depth level: ${state.questionDepth}
3. Builds on the conversation naturally
4. Is specific and actionable

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

