import { INTERVIEW_TOPICS } from './ai/interview-flow'

/**
 * Infer topic from question content (for tracking)
 * Pure utility function - can be used on client or server
 */
export function inferTopicFromQuestion(question: string): string | null {
    const lowerQuestion = question.toLowerCase()
    
    // Match topics based on keywords
    for (const topic of INTERVIEW_TOPICS) {
        const topicKeywords = [
            topic.id,
            topic.name.toLowerCase(),
            ...topic.name.toLowerCase().split('/'),
            ...topic.name.toLowerCase().split(' ')
        ]
        
        if (topicKeywords.some(keyword => lowerQuestion.includes(keyword))) {
            return topic.id
        }
    }
    
    // Fallback: check for common tech keywords
    if (lowerQuestion.includes('kubernetes') || lowerQuestion.includes('k8s') || lowerQuestion.includes('pod') || lowerQuestion.includes('cluster')) {
        return 'kubernetes'
    }
    if (lowerQuestion.includes('ci/cd') || lowerQuestion.includes('pipeline') || lowerQuestion.includes('jenkins') || lowerQuestion.includes('github actions')) {
        return 'cicd'
    }
    if (lowerQuestion.includes('terraform') || lowerQuestion.includes('iac') || lowerQuestion.includes('infrastructure as code')) {
        return 'terraform'
    }
    if (lowerQuestion.includes('helm') || lowerQuestion.includes('chart')) {
        return 'helm'
    }
    if (lowerQuestion.includes('deployment') || lowerQuestion.includes('rollout') || lowerQuestion.includes('blue-green') || lowerQuestion.includes('canary')) {
        return 'deployment'
    }
    if (lowerQuestion.includes('aws') || lowerQuestion.includes('azure') || lowerQuestion.includes('gcp') || lowerQuestion.includes('cloud')) {
        return 'cloud'
    }
    
    return null
}

