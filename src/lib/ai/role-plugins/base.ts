/**
 * Base interfaces for role plugins
 * This allows the interview brain to work with any role
 */

export interface TopicDefinition {
    id: string                        // "kubernetes", "react", "api-design"
    name: string                      // "Kubernetes/OpenShift", "React", "API Design"
    description: string
    entryLevelQuestions: string[]     // Foundational questions for entry level
    seniorLevelQuestions: string[]    // Advanced scenarios for senior level
    drillDownPaths: DrillDownPath[]   // How to drill down based on answers
}

export interface DrillDownPath {
    trigger: string[]                 // Keywords that trigger this drill-down path
    questions: string[]               // Progressive questions for this path
}

export interface EvaluationCriteria {
    technical: string[]               // Technical competencies to evaluate
    soft: string[]                    // Soft skills to evaluate
}

export interface ScoringRubric {
    // Role-specific scoring criteria
    [key: string]: any
}

export interface ExpertScenario {
    id: string
    title: string
    description: string
    difficulty: 'entry' | 'mid' | 'senior' | 'architect'
    scenario: string                  // The scenario description
    drillDownPath: string[]           // Questions to ask
    evaluationPoints: string[]        // What to look for in answers
}

/**
 * Role Plugin Interface
 * Each role (DevOps, Frontend, Backend, etc.) implements this interface
 */
export interface RolePlugin {
    // Role metadata
    roleId: string                    // "devops", "frontend", "backend"
    roleName: string                  // "DevOps Engineer", "Frontend Engineer"
    supportedLevels: string[]         // ["entry", "mid", "senior", "architect"]
    
    // Technology detection
    technologyKeywords: string[]      // Technologies to extract from candidate intro
    technologyCategories: {            // Group technologies by category/topic
        [category: string]: string[]
    }
    
    // Topic system
    topics: TopicDefinition[]         // Available topics for this role
    defaultTopicProgression: string[] // Default topic order (can be overridden by candidate intro)
    
    // Question generation
    getQuestionTemplate(
        topic: string,
        level: string,
        depth: number,
        candidateTech: string[]
    ): string | null                  // Returns template or null (use LLM)
    
    // Evaluation
    evaluationCriteria: EvaluationCriteria
    scoringRubric: ScoringRubric
    
    // Expert scenarios
    expertScenarios: ExpertScenario[]
    
    // Optional: Custom logic
    getTopicProgression?(candidateIntro: any): string[]  // Override default progression
    shouldSkipTopic?(topic: string, candidateIntro: any): boolean  // Skip topics candidate doesn't know
}


