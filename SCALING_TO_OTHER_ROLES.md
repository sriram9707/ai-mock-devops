# Scaling Interview Brain to Other Roles

## 🎯 Current State (DevOps/SRE Focused)

**What's Role-Specific (Hardcoded):**
- Technology keywords (Kubernetes, AWS, Terraform, etc.)
- Topic progression (K8s → CI/CD → AWS → Terraform)
- Question templates (DevOps scenarios)
- Evaluation criteria (DevOps/SRE rubrics)

**What's Generic (Reusable):**
- Progressive questioning logic (basic → advanced)
- Drill-down mechanism (5+ levels)
- Topic flow management
- Candidate intro extraction (structure, not tech)

## 🏗️ Scalable Architecture Design

### Architecture Pattern: **Plugin-Based Role System**

```
┌─────────────────────────────────────────┐
│  Core Interview Engine (Role-Agnostic)  │
├─────────────────────────────────────────┤
│  • Progressive questioning logic        │
│  • Drill-down mechanism                  │
│  • Topic flow management                 │
│  • Candidate intro extraction            │
│  • Conversation state tracking           │
└─────────────────────────────────────────┘
           ↓ (uses)
┌─────────────────────────────────────────┐
│  Role Plugins (Role-Specific)           │
├─────────────────────────────────────────┤
│  • Technology keywords                   │
│  • Topic definitions & progression      │
│  • Question templates                    │
│  • Evaluation criteria                   │
│  • Expert scenarios                      │
└─────────────────────────────────────────┘
```

## 📁 File Structure

```
src/lib/ai/
├── interview-brain.ts          # Core engine (role-agnostic)
├── role-plugins/
│   ├── base.ts                 # Base interface
│   ├── devops.ts               # DevOps/SRE plugin
│   ├── frontend.ts              # Frontend plugin
│   ├── backend.ts               # Backend plugin
│   ├── data-engineer.ts         # Data Engineer plugin
│   └── index.ts                 # Plugin registry
├── prompts.ts                   # Generic prompts (uses plugins)
└── scoring.ts                   # Generic scoring (uses plugins)
```

## 🔌 Plugin Interface

```typescript
// src/lib/ai/role-plugins/base.ts

export interface RolePlugin {
  // Role metadata
  roleId: string                    // "devops", "frontend", "backend"
  roleName: string                  // "DevOps Engineer"
  supportedLevels: string[]         // ["entry", "mid", "senior", "architect"]
  
  // Technology detection
  technologyKeywords: string[]      // Technologies to extract from intro
  technologyCategories: {            // Group technologies by category
    [category: string]: string[]
  }
  
  // Topic system
  topics: TopicDefinition[]         // Available topics for this role
  defaultTopicProgression: string[] // Default order (can be overridden)
  
  // Question generation
  getQuestionTemplate(
    topic: string,
    level: string,
    depth: number,
    candidateTech: string[]
  ): string | null
  
  // Evaluation
  evaluationCriteria: EvaluationCriteria
  scoringRubric: ScoringRubric
  
  // Expert scenarios
  expertScenarios: ExpertScenario[]
}

export interface TopicDefinition {
  id: string                        // "kubernetes", "react", "api-design"
  name: string                      // "Kubernetes/OpenShift", "React", "API Design"
  description: string
  entryLevelQuestions: string[]     // Foundational questions
  seniorLevelQuestions: string[]    // Advanced scenarios
  drillDownPaths: DrillDownPath[]   // How to drill down
}

export interface DrillDownPath {
  trigger: string[]                 // Keywords that trigger this path
  questions: string[]               // Progressive questions
}
```

## 🎨 Example: Frontend Plugin

```typescript
// src/lib/ai/role-plugins/frontend.ts

export const frontendPlugin: RolePlugin = {
  roleId: 'frontend',
  roleName: 'Frontend Engineer',
  supportedLevels: ['entry', 'mid', 'senior', 'architect'],
  
  technologyKeywords: [
    'react', 'vue', 'angular', 'next.js', 'typescript', 'javascript',
    'css', 'html', 'sass', 'tailwind', 'webpack', 'vite',
    'redux', 'zustand', 'graphql', 'rest', 'jest', 'cypress'
  ],
  
  technologyCategories: {
    frameworks: ['react', 'vue', 'angular', 'next.js', 'nuxt'],
    languages: ['typescript', 'javascript'],
    styling: ['css', 'sass', 'tailwind', 'styled-components'],
    state: ['redux', 'zustand', 'mobx', 'recoil'],
    testing: ['jest', 'cypress', 'playwright', 'testing-library']
  },
  
  topics: [
    {
      id: 'react',
      name: 'React',
      description: 'Component architecture, hooks, performance',
      entryLevelQuestions: [
        'What are the different types of components in React?',
        'What is the difference between functional and class components?',
        'How do you manage state in React?'
      ],
      seniorLevelQuestions: [
        'Your React app is experiencing performance issues. Users report slow interactions. Walk me through your debugging process.',
        'You need to optimize a component that re-renders too frequently. How do you approach this?'
      ],
      drillDownPaths: [
        {
          trigger: ['hooks', 'useState', 'useEffect'],
          questions: [
            'You mentioned hooks. What happens if you use useState in a loop?',
            'How do you handle side effects in useEffect?',
            'What about cleanup functions? When are they called?'
          ]
        },
        {
          trigger: ['performance', 'optimization', 'memo'],
          questions: [
            'You mentioned performance. How does React.memo work?',
            'What about useMemo and useCallback? When would you use each?',
            'What are the trade-offs of over-optimization?'
          ]
        }
      ]
    },
    {
      id: 'state-management',
      name: 'State Management',
      description: 'Global state, local state, data fetching',
      entryLevelQuestions: [
        'What is state management? Why do we need it?',
        'What\'s the difference between local and global state?'
      ],
      seniorLevelQuestions: [
        'Your application state is becoming unmanageable. Components are re-rendering unnecessarily. How do you refactor this?',
        'You need to share state between components that are far apart in the tree. What are your options?'
      ],
      drillDownPaths: [...]
    },
    {
      id: 'testing',
      name: 'Testing',
      description: 'Unit tests, integration tests, E2E',
      entryLevelQuestions: [
        'What is the difference between unit tests and integration tests?',
        'How do you test React components?'
      ],
      seniorLevelQuestions: [
        'Your test suite is slow and flaky. How do you improve it?',
        'You need to test a component that depends on external APIs. How do you handle this?'
      ],
      drillDownPaths: [...]
    }
  ],
  
  defaultTopicProgression: ['react', 'state-management', 'testing', 'performance', 'architecture'],
  
  getQuestionTemplate(topic, level, depth, candidateTech) {
    const topicDef = this.topics.find(t => t.id === topic)
    if (!topicDef) return null
    
    if (level === 'entry' && depth === 0) {
      return topicDef.entryLevelQuestions[
        Math.floor(Math.random() * topicDef.entryLevelQuestions.length)
      ]
    }
    
    if (level === 'senior' && depth === 0) {
      return topicDef.seniorLevelQuestions[
        Math.floor(Math.random() * topicDef.seniorLevelQuestions.length)
      ]
    }
    
    // Drill down based on depth
    return null // Will use LLM for dynamic generation
  },
  
  evaluationCriteria: {
    technical: ['component-architecture', 'state-management', 'performance', 'testing'],
    soft: ['problem-solving', 'communication', 'code-quality']
  },
  
  scoringRubric: {
    // Frontend-specific scoring
  },
  
  expertScenarios: [
    // Frontend-specific expert scenarios
  ]
}
```

## 🔄 Core Engine (Role-Agnostic)

```typescript
// src/lib/ai/interview-brain.ts (Updated)

import { getRolePlugin } from './role-plugins'

export function extractCandidateIntro(
  introText: string,
  rolePlugin: RolePlugin  // Pass plugin instead of hardcoding
): CandidateIntro {
  const lower = introText.toLowerCase()
  
  // Use plugin's technology keywords
  const mentionedTech: string[] = []
  rolePlugin.technologyKeywords.forEach(tech => {
    if (lower.includes(tech)) {
      mentionedTech.push(tech)
    }
  })
  
  // Rest of extraction logic (years, level, etc.) stays the same
  // ...
}

export function getTopicProgression(
  candidateIntro: CandidateIntro,
  rolePlugin: RolePlugin  // Use plugin's topics
): string[] {
  const priority: string[] = []
  
  // Priority 1: Technologies candidate mentioned (use plugin's categories)
  rolePlugin.topics.forEach(topic => {
    if (candidateIntro.technologies.some(tech => 
      rolePlugin.technologyCategories[topic.id]?.includes(tech)
    )) {
      priority.push(topic.id)
    }
  })
  
  // Priority 2: Default progression from plugin
  rolePlugin.defaultTopicProgression.forEach(topic => {
    if (!priority.includes(topic)) {
      priority.push(topic)
    }
  })
  
  return priority
}

export function generateProgressiveQuestion(
  topic: string,
  level: string,
  depth: number,
  candidateTech: string[],
  rolePlugin: RolePlugin,  // Use plugin's templates
  previousAnswer?: string
): string {
  // Try plugin's template first
  const template = rolePlugin.getQuestionTemplate(topic, level, depth, candidateTech)
  if (template) {
    return template
  }
  
  // If no template, use LLM with plugin's context
  return generateFromLLM(topic, level, depth, candidateTech, rolePlugin, previousAnswer)
}
```

## 📊 Plugin Registry

```typescript
// src/lib/ai/role-plugins/index.ts

import { devopsPlugin } from './devops'
import { frontendPlugin } from './frontend'
import { backendPlugin } from './backend'
import { dataEngineerPlugin } from './data-engineer'

const PLUGINS: Record<string, RolePlugin> = {
  'devops': devopsPlugin,
  'sre': devopsPlugin,  // Can reuse or create separate
  'frontend': frontendPlugin,
  'backend': backendPlugin,
  'data-engineer': dataEngineerPlugin
}

export function getRolePlugin(roleId: string): RolePlugin {
  const plugin = PLUGINS[roleId.toLowerCase()]
  if (!plugin) {
    console.warn(`No plugin found for role: ${roleId}, using devops as fallback`)
    return PLUGINS['devops']
  }
  return plugin
}

export function getAllPlugins(): RolePlugin[] {
  return Object.values(PLUGINS)
}
```

## 🔗 Integration Points

### 1. Prompt Generation
```typescript
// src/lib/ai/prompts.ts

export function generateSystemPrompt(ctx: PromptContext): string {
  const rolePlugin = getRolePlugin(ctx.packRole)  // Get plugin for role
  
  // Use plugin's topics, scenarios, evaluation criteria
  const topics = rolePlugin.topics.map(t => t.name).join(', ')
  const expertScenarios = rolePlugin.expertScenarios
  
  // Build prompt with plugin data
  // ...
}
```

### 2. Interview Brain
```typescript
// src/lib/ai/interview-brain.ts

export function getNextQuestion(state: InterviewState, rolePlugin: RolePlugin) {
  // Use plugin's topic progression, question templates
  // ...
}
```

### 3. Scoring
```typescript
// src/lib/ai/scoring.ts

export async function scoreInterview(sessionId: string): Promise<ScoringRubric> {
  const session = await prisma.interviewSession.findUnique({...})
  const rolePlugin = getRolePlugin(session.pack.role)
  
  // Use plugin's scoring rubric
  const scoringPrompt = buildScoringPrompt(rolePlugin.evaluationCriteria)
  // ...
}
```

## 🚀 Adding a New Role (5 Steps)

### Step 1: Create Plugin File
```typescript
// src/lib/ai/role-plugins/mobile.ts

export const mobilePlugin: RolePlugin = {
  roleId: 'mobile',
  roleName: 'Mobile Engineer',
  // ... define technologies, topics, questions
}
```

### Step 2: Register Plugin
```typescript
// src/lib/ai/role-plugins/index.ts

import { mobilePlugin } from './mobile'

const PLUGINS = {
  // ...
  'mobile': mobilePlugin
}
```

### Step 3: Add to Database Seed
```typescript
// prisma/seed.ts

await prisma.interviewPack.create({
  data: {
    title: 'Mobile Engineer - Entry Level',
    role: 'mobile',
    level: 'entry',
    // ...
  }
})
```

### Step 4: Update UI (if needed)
- Dashboard shows new role
- Onboarding includes mobile skills

### Step 5: Test
- Run interview with mobile role
- Verify questions are relevant
- Check scoring works

## 📋 Role Plugin Template

```typescript
// Template for creating new role plugins

export const [role]Plugin: RolePlugin = {
  roleId: '[role-id]',
  roleName: '[Role Name]',
  supportedLevels: ['entry', 'mid', 'senior', 'architect'],
  
  technologyKeywords: [
    // List all relevant technologies
  ],
  
  technologyCategories: {
    // Group by category
  },
  
  topics: [
    {
      id: 'topic-1',
      name: 'Topic Name',
      description: '...',
      entryLevelQuestions: [
        // Foundational questions
      ],
      seniorLevelQuestions: [
        // Advanced scenarios
      ],
      drillDownPaths: [
        // How to drill down
      ]
    }
  ],
  
  defaultTopicProgression: [
    // Default order
  ],
  
  getQuestionTemplate(topic, level, depth, candidateTech) {
    // Template logic
  },
  
  evaluationCriteria: {
    // What to evaluate
  },
  
  scoringRubric: {
    // How to score
  },
  
  expertScenarios: [
    // Expert scenarios
  ]
}
```

## 🎯 Benefits of This Architecture

1. **Scalable**: Add new roles by creating one plugin file
2. **Maintainable**: Role-specific logic isolated
3. **Testable**: Test each plugin independently
4. **Flexible**: Can override defaults per role
5. **Reusable**: Core engine works for all roles

## 📊 Current vs Scalable

| Aspect | Current (Hardcoded) | Scalable (Plugin-Based) |
|--------|-------------------|------------------------|
| **Add New Role** | Modify multiple files | Create 1 plugin file |
| **Technology Detection** | Hardcoded in brain.ts | Defined in plugin |
| **Topic Progression** | Hardcoded K8s→CI/CD→AWS | Defined in plugin |
| **Question Templates** | Mixed in brain.ts | Isolated in plugin |
| **Testing** | Test entire system | Test plugin independently |

## 🚀 Migration Path

1. **Phase 1**: Extract DevOps logic into plugin (refactor existing)
2. **Phase 2**: Create plugin interface and registry
3. **Phase 3**: Update core engine to use plugins
4. **Phase 4**: Add first new role (Frontend) as proof of concept
5. **Phase 5**: Document and scale to other roles

This architecture makes it **trivial to add new roles** - just create a plugin file with the role's technologies, topics, and questions!


