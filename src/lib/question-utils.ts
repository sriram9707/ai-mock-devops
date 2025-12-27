import crypto from 'crypto'

/**
 * Generate a hash for a question to detect duplicates
 */
export function hashQuestion(questionText: string): string {
    // Normalize: lowercase, remove extra spaces, remove punctuation
    const normalized = questionText
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    
    return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16)
}

/**
 * Check if a message contains a question
 */
export function isQuestion(message: string): boolean {
    // Simple heuristic: check for question marks or question words
    const questionIndicators = [
        /\?/,
        /^(how|what|why|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were)\s/i,
        /^tell me/i,
        /^explain/i,
        /^describe/i,
        /^walk me through/i,
        /^can you/i
    ]
    
    return questionIndicators.some(pattern => pattern.test(message.trim()))
}

