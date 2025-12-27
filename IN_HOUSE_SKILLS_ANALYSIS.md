# In-House Skills & Knowledge Base Analysis

## 🎯 Your Concern

**Problem**: Alex feels like "just reading LLM responses" - no "brain" in-house
**Goal**: Add skills/knowledge in-house for:
- Faster responses
- More consistent behavior
- Less dependency on LLM for every turn
- Dynamic skills based on persona

## 📊 Current Architecture

### What Happens Now:
```
Every Turn:
1. User speaks → VAPI STT → Text
2. Fetch session context (DB query)
3. Generate system prompt (string concatenation)
4. Send to OpenAI GPT-4o (LLM call)
5. Stream response back
6. Save to DB

Latency: ~500-1000ms per turn (mostly LLM)
Cost: ~$0.01-0.02 per turn
```

### The "Reading LLM" Problem:
- Every response is generated fresh by LLM
- No local knowledge base
- No caching of common responses
- No pre-computed question templates
- LLM has to "think" from scratch each time

## 💡 Proposed Solution: In-House Skills Base

### Architecture Option 1: **Hybrid Knowledge Base** (Recommended)

```
┌─────────────────────────────────────┐
│  In-House Skills Base (Local)       │
├─────────────────────────────────────┤
│  • Persona-specific skills          │
│  • Common question templates        │
│  • Technical knowledge snippets     │
│  • Evaluation criteria              │
│  • Response patterns                │
└─────────────────────────────────────┘
           ↓ (Fast lookup)
┌─────────────────────────────────────┐
│  Response Generator                  │
├─────────────────────────────────────┤
│  1. Check local knowledge base      │
│  2. If match → Use template + fill  │
│  3. If no match → LLM generation    │
└─────────────────────────────────────┘
```

**Benefits**:
- ✅ Faster responses (50-200ms vs 500-1000ms)
- ✅ More consistent behavior
- ✅ Lower cost (fewer LLM calls)
- ✅ Better control over quality

**Implementation**:
```typescript
// Local knowledge base
const INTERVIEWER_SKILLS = {
  'Senior Engineer': {
    commonQuestions: [...],
    technicalKnowledge: {...},
    responsePatterns: [...],
    evaluationCriteria: [...]
  },
  'Cloud Architect': {
    // Different skills for architect persona
  }
}

// Fast lookup
function generateResponse(candidateAnswer: string, persona: string) {
  // 1. Check if we have a template match
  const template = findTemplate(candidateAnswer, persona)
  if (template) {
    return fillTemplate(template, candidateAnswer) // Fast!
  }
  
  // 2. Fallback to LLM
  return llmGenerate(candidateAnswer, persona) // Slower but flexible
}
```

### Architecture Option 2: **RAG-Based Knowledge Base**

```
┌─────────────────────────────────────┐
│  Vector Database (Local/Cloud)       │
├─────────────────────────────────────┤
│  • Embeddings of expert scenarios   │
│  • Technical knowledge chunks       │
│  • Question templates               │
│  • Persona-specific knowledge       │
└─────────────────────────────────────┘
           ↓ (Semantic search)
┌─────────────────────────────────────┐
│  RAG Retrieval                       │
├─────────────────────────────────────┤
│  1. Query vector DB for relevant    │
│  2. Retrieve top 3-5 chunks         │
│  3. Inject into LLM prompt          │
│  4. LLM generates with context      │
└─────────────────────────────────────┘
```

**Benefits**:
- ✅ More flexible (semantic search)
- ✅ Can handle large knowledge base
- ✅ Better for dynamic content

**Drawbacks**:
- ❌ More complex (vector DB, embeddings)
- ❌ Still requires LLM call (just with context)
- ❌ Higher latency than pure templates
- ❌ More expensive (embedding + LLM)

## 🎯 Recommendation: **Hybrid Approach**

### Phase 1: Template-Based Fast Path (Do This First)

**What to Build**:
1. **Question Templates** (in-house)
   - Common question patterns
   - Fill-in-the-blank style
   - Persona-specific variations

2. **Response Patterns** (in-house)
   - Common acknowledgments ("Got it", "Makes sense")
   - Transition phrases
   - Follow-up question starters

3. **Technical Knowledge Snippets** (in-house)
   - Common debugging steps
   - Tool-specific knowledge
   - Evaluation criteria

**Example**:
```typescript
const QUESTION_TEMPLATES = {
  'kubernetes': {
    'entry': [
      "Your {{candidate_tool}} pods are stuck in {{state}}. Walk me through your debugging process.",
      "You're seeing {{symptom}} in your {{candidate_tool}} cluster. How would you investigate?",
    ],
    'senior': [
      "Your {{candidate_tool}} cluster is experiencing {{complex_issue}} during {{constraint}}. How do you handle this?",
    ]
  }
}

// Fast generation (no LLM call)
function generateQuestion(topic: string, level: string, candidateTech: string) {
  const templates = QUESTION_TEMPLATES[topic]?.[level] || []
  const template = templates[Math.floor(Math.random() * templates.length)]
  return template
    .replace('{{candidate_tool}}', candidateTech)
    .replace('{{state}}', 'Pending')
    .replace('{{symptom}}', 'high latency')
    // ... fill in from local knowledge
}
```

**Benefits**:
- ✅ **50-200ms response time** (vs 500-1000ms)
- ✅ **Consistent quality** (pre-validated templates)
- ✅ **Lower cost** (no LLM call for common questions)
- ✅ **Easy to maintain** (just TypeScript)

### Phase 2: Smart Routing (Add Intelligence)

**When to Use Templates vs LLM**:

```typescript
function shouldUseTemplate(candidateAnswer: string, context: Context): boolean {
  // Use template if:
  // 1. Standard acknowledgment needed
  if (isStandardAcknowledgment(candidateAnswer)) return true
  
  // 2. Common question pattern
  if (matchesCommonPattern(candidateAnswer)) return true
  
  // 3. Simple follow-up
  if (isSimpleFollowUp(candidateAnswer)) return true
  
  // Use LLM if:
  // 1. Complex/unexpected answer
  // 2. Need deep drill-down
  // 3. Candidate mentions something new
  return false
}
```

**Result**: 
- 70-80% of responses use templates (fast)
- 20-30% use LLM (flexible)

### Phase 3: Persona-Specific Skills (Dynamic)

**What to Add**:
```typescript
interface PersonaSkills {
  technicalDepth: 'foundational' | 'intermediate' | 'expert'
  focusAreas: string[]
  commonQuestions: QuestionTemplate[]
  evaluationCriteria: string[]
  responseStyle: 'supportive' | 'challenging' | 'neutral'
}

const PERSONA_SKILLS: Record<string, PersonaSkills> = {
  'Senior Engineer': {
    technicalDepth: 'intermediate',
    focusAreas: ['troubleshooting', 'debugging', 'basic incidents'],
    commonQuestions: [...],
    evaluationCriteria: ['problem-solving', 'communication'],
    responseStyle: 'supportive'
  },
  'Cloud Architect': {
    technicalDepth: 'expert',
    focusAreas: ['architecture', 'trade-offs', 'scale'],
    commonQuestions: [...],
    evaluationCriteria: ['strategic thinking', 'system design'],
    responseStyle: 'challenging'
  }
}
```

**Dynamic Loading**:
```typescript
function getPersonaSkills(packLevel: string): PersonaSkills {
  const persona = getInterviewerPersona(packLevel)
  return PERSONA_SKILLS[persona.title] || DEFAULT_SKILLS
}

// Use in prompt generation
const skills = getPersonaSkills(session.pack.level)
const systemPrompt = generateSystemPrompt({
  ...ctx,
  personaSkills: skills // Inject into prompt
})
```

## 📊 Comparison

| Approach | Latency | Cost | Quality | Complexity |
|----------|---------|------|---------|------------|
| **Current (Pure LLM)** | 500-1000ms | High | Good | Low |
| **Template-Based** | 50-200ms | Low | Consistent | Medium |
| **RAG-Based** | 300-600ms | Medium | Good | High |
| **Hybrid (Recommended)** | 100-400ms | Medium | Best | Medium |

## 🚀 Implementation Plan

### Step 1: Build Question Template Library (1-2 days)
```typescript
// src/lib/ai/question-templates.ts
export const QUESTION_TEMPLATES = {
  kubernetes: {
    entry: [...],
    senior: [...],
    architect: [...]
  },
  cicd: {...},
  // ... etc
}
```

### Step 2: Build Response Pattern Library (1 day)
```typescript
// src/lib/ai/response-patterns.ts
export const RESPONSE_PATTERNS = {
  acknowledgment: ['Got it', 'Makes sense', 'Interesting'],
  transition: ['Let\'s dive deeper', 'Good point', 'Now let\'s explore'],
  followUp: ['What if...', 'How would you handle...', 'Tell me about...']
}
```

### Step 3: Smart Router (1 day)
```typescript
// src/lib/ai/response-router.ts
export function generateResponse(
  candidateAnswer: string,
  context: Context
): string {
  // Check if template match
  if (shouldUseTemplate(candidateAnswer, context)) {
    return generateFromTemplate(candidateAnswer, context)
  }
  
  // Fallback to LLM
  return generateFromLLM(candidateAnswer, context)
}
```

### Step 4: Persona-Specific Skills (1 day)
```typescript
// src/lib/ai/persona-skills.ts
export function getPersonaSkills(level: string): PersonaSkills {
  // Dynamic based on persona
}
```

## ⚠️ Important Considerations

### 1. **Don't Over-Optimize**
- Start with templates for common cases
- Keep LLM for complex/unexpected cases
- 70/30 split is good (templates/LLM)

### 2. **Maintain Quality**
- Templates must be pre-validated
- Test with real interviews
- Don't sacrifice quality for speed

### 3. **Balance Consistency vs Flexibility**
- Templates = consistent but rigid
- LLM = flexible but variable
- Use templates for common patterns, LLM for edge cases

### 4. **Voice Interview Constraints**
- Need < 500ms response time for natural flow
- Templates help achieve this
- But don't sacrifice naturalness

## 🎯 Final Recommendation

**Do This**:
1. ✅ **Build template library** for common questions (fast path)
2. ✅ **Add persona-specific skills** (dynamic loading)
3. ✅ **Smart routing** (templates vs LLM)
4. ✅ **Keep LLM** for complex/unexpected cases

**Don't Do This**:
1. ❌ Full RAG system (overkill for now)
2. ❌ Replace LLM entirely (lose flexibility)
3. ❌ Over-optimize (keep 70/30 split)

**Result**:
- ✅ Faster responses (100-400ms average)
- ✅ Lower cost (30-50% reduction)
- ✅ More consistent quality
- ✅ Still flexible for edge cases
- ✅ Alex feels more "intelligent" (pre-loaded knowledge)

## 💰 Cost Impact

**Current**:
- 50 turns/interview × $0.01/turn = $0.50/interview

**With Templates**:
- 35 turns use templates (free) + 15 turns use LLM ($0.01/turn)
- = $0.15/interview
- **70% cost reduction**

## 🎯 Next Steps

1. **Start Small**: Build 10-20 question templates for most common scenarios
2. **Test**: Run 5-10 interviews and measure:
   - Response time
   - Quality (user feedback)
   - Cost
3. **Iterate**: Add more templates based on what works
4. **Scale**: Expand to cover 70-80% of questions

This gives you the "in-house brain" you want while keeping flexibility for edge cases!

