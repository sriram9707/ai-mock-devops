# Architecture Analysis & Recommendations

## Current Architecture

### Flow
```
User → VAPI.ai (Voice) → /api/vapi/chat → OpenAI → Stream Response → VAPI → User
                              ↓
                         Prisma/SQLite
```

### Current Stack
- **Frontend**: Next.js 16 (React 19)
- **Voice AI**: VAPI.ai (handles STT, TTS, voice)
- **LLM**: OpenAI GPT-4o (via custom endpoint)
- **Database**: SQLite (Prisma ORM)
- **Deployment**: Single Next.js app (assumed)

---

## 🔴 Critical Issues

### 1. **Database Queries on Every Turn** (HIGH IMPACT)
**Problem**: On every chat turn, you're:
- Fetching session + user + profile + pack (3 queries)
- Fetching previous questions (1 query)
- Parsing JD JSON
- Regenerating system prompt
- Saving turns after streaming

**Impact**: 
- **Latency**: 200-500ms per turn just for DB queries
- **Cost**: Unnecessary compute on every request
- **Scalability**: Will break under load

**Current Code**:
```typescript
// Happens on EVERY turn
const session = await prisma.interviewSession.findUnique({...})
const previousQuestions = await getPreviousQuestions(...)
systemPrompt = generateSystemPrompt({...}) // Expensive string operations
```

### 2. **SQLite Limitations** (MEDIUM-HIGH IMPACT)
**Problem**: SQLite doesn't scale:
- Single writer (bottleneck)
- No connection pooling
- File-based (not great for serverless)
- Limited concurrent writes

**Impact**: Will fail at ~100 concurrent interviews

### 3. **No Caching** (HIGH IMPACT)
**Problem**: 
- System prompts regenerated every turn (same input = same output)
- JD parsing happens every turn
- Previous questions fetched every turn
- No Redis/cache layer

**Impact**: Wasted compute, higher latency, higher costs

### 4. **Synchronous Heavy Operations** (MEDIUM IMPACT)
**Problem**:
- Scoring happens synchronously after interview
- Analytics computed on-demand
- No background jobs

**Impact**: Slow response times, user waits

### 5. **Prompt Size** (MEDIUM IMPACT)
**Problem**: System prompt is HUGE (~3000+ tokens)
- Sent on every request
- Includes full question bank, role prompts, JD, etc.

**Impact**: Higher token costs, slower responses

---

## ✅ What's Working Well

1. **Clean separation**: VAPI handles voice, you handle LLM
2. **Streaming**: Good UX with streaming responses
3. **Question tracking**: Smart deduplication
4. **JD integration**: Good feature
5. **Modular code**: Well-organized

---

## 🎯 Recommended Architecture Changes

### Phase 1: Quick Wins (This Week) - **DO THESE**

#### 1. Add Prompt Caching
```typescript
// Cache system prompts per session
const promptCache = new Map<string, { prompt: string, expires: number }>()

// On handshake, cache for session
const cacheKey = `prompt:${sessionId}`
promptCache.set(cacheKey, {
    prompt: systemPrompt,
    expires: Date.now() + 3600000 // 1 hour
})

// On subsequent turns, use cached prompt
const cached = promptCache.get(cacheKey)
if (cached && cached.expires > Date.now()) {
    systemPrompt = cached.prompt
}
```

**Impact**: 
- Reduces prompt generation by 90%
- Saves ~100ms per turn
- Reduces compute costs

#### 2. Batch Database Queries
```typescript
// Instead of multiple queries, use Promise.all
const [session, previousQuestions] = await Promise.all([
    prisma.interviewSession.findUnique({...}),
    getPreviousQuestions(...)
])
```

**Impact**: 
- Reduces latency by 50-100ms
- Better resource utilization

#### 3. Move to PostgreSQL
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Impact**: 
- Better concurrency
- Connection pooling
- Scales to 1000s of users

**Effort**: 2-3 hours (migration + deploy)

#### 4. Cache Previous Questions
```typescript
// Cache previous questions per user+pack
const questionsCache = new Map<string, string[]>()

// Fetch once, cache for 5 minutes
const cacheKey = `questions:${userId}:${packId}`
```

**Impact**: 
- Reduces DB queries
- Faster responses

---

### Phase 2: Medium-Term (Next Month)

#### 5. Add Redis for Caching
```typescript
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

// Cache prompts
await redis.setex(`prompt:${sessionId}`, 3600, systemPrompt)

// Cache previous questions
await redis.setex(`questions:${userId}:${packId}`, 300, JSON.stringify(questions))
```

**Impact**: 
- Shared cache across instances
- Better performance
- Scales horizontally

**Cost**: ~$5-10/month (Redis on Vercel/Railway)

#### 6. Background Job Queue
```typescript
// Use BullMQ or similar
import { Queue } from 'bullmq'

const scoringQueue = new Queue('scoring', {
    connection: { host: 'redis' }
})

// After interview ends
await scoringQueue.add('score-interview', { sessionId })
```

**Impact**: 
- Instant response to user
- Scoring happens async
- Better UX

**Options**: 
- BullMQ (Redis-based)
- Inngest (serverless-friendly)
- Vercel Cron + API route

#### 7. Optimize Prompt Size
```typescript
// Instead of full prompt every time, use shorter version
// Store full context in session metadata
const shortPrompt = `You are Alex. Session context: ${sessionId}`
// Fetch full context only when needed
```

**Impact**: 
- Reduces token costs by 30-50%
- Faster responses

---

### Phase 3: Long-Term (If Scaling)

#### 8. Separate Services
```
┌─────────────┐
│   Next.js   │ (Frontend + API Routes)
└──────┬──────┘
       │
       ├─→ ┌─────────────┐
       │   │  Redis      │ (Cache)
       │   └─────────────┘
       │
       ├─→ ┌─────────────┐
       │   │ PostgreSQL  │ (Database)
       │   └─────────────┘
       │
       └─→ ┌─────────────┐
           │  Worker     │ (Background Jobs)
           └─────────────┘
```

**When**: 
- 1000+ concurrent users
- Need better isolation
- Team grows

**Options**:
- Keep monolithic (simpler)
- Microservices (complex, but scalable)

#### 9. Edge Functions for Prompt Generation
```typescript
// Move prompt generation to edge
// Cache at edge level
export const runtime = 'edge'
```

**Impact**: 
- Lower latency
- Better global performance

---

## 💰 Cost Analysis

### Current Costs (per interview):
- **VAPI**: ~$0.50-1.00 (voice AI)
- **OpenAI**: ~$0.10-0.30 (GPT-4o, ~3000 tokens system + 500 tokens/turn)
- **Database**: ~$0 (SQLite, but will need hosting)
- **Total**: ~$0.60-1.30 per interview

### With Optimizations:
- **VAPI**: ~$0.50-1.00 (same)
- **OpenAI**: ~$0.05-0.15 (cached prompts, shorter prompts)
- **Redis**: ~$0.001 (caching)
- **PostgreSQL**: ~$0.01 (hosting)
- **Total**: ~$0.56-1.16 per interview

**Savings**: ~10-15% per interview

---

## 🚀 Migration Plan

### Week 1: Quick Wins
1. ✅ Add prompt caching (in-memory)
2. ✅ Batch DB queries
3. ✅ Move to PostgreSQL

### Week 2: Caching
4. ✅ Add Redis
5. ✅ Cache previous questions
6. ✅ Cache JD parsing

### Week 3: Background Jobs
7. ✅ Add job queue
8. ✅ Move scoring to background
9. ✅ Move analytics to background

### Week 4: Optimization
10. ✅ Optimize prompt size
11. ✅ Add monitoring
12. ✅ Load testing

---

## 🎯 My Recommendation

### **For Now (MVP/Beta)**: 
**Keep current architecture, but add:**
1. ✅ Prompt caching (in-memory)
2. ✅ PostgreSQL migration
3. ✅ Batch queries

**Why**: 
- Quick wins
- Low risk
- Big impact
- Don't over-engineer

### **When Scaling (100+ users)**:
**Add:**
4. ✅ Redis caching
5. ✅ Background jobs
6. ✅ Monitoring

### **Don't Change**:
- ❌ VAPI integration (works well)
- ❌ Overall flow (clean)
- ❌ Code structure (good)

---

## 📊 Performance Targets

### Current (Estimated):
- Turn latency: 800-1200ms
- Interview start: 2-3s
- Scoring: 5-10s (synchronous)

### With Optimizations:
- Turn latency: 400-600ms (50% faster)
- Interview start: 1-2s (50% faster)
- Scoring: <1s response, 5-10s background (better UX)

---

## 🔍 Monitoring

Add these metrics:
- Turn latency (p50, p95, p99)
- Database query time
- Cache hit rate
- OpenAI token usage
- Error rate

**Tools**: 
- Vercel Analytics
- Sentry (errors)
- Custom dashboard

---

## ✅ Bottom Line

**Do you need to change architecture?** 

**Short answer**: Not drastically, but optimize.

**Priority fixes**:
1. ✅ Add caching (biggest win)
2. ✅ Move to PostgreSQL (scalability)
3. ✅ Background jobs (UX)

**Don't over-engineer** until you have:
- 100+ concurrent users
- Proven product-market fit
- Revenue to justify complexity

**Current architecture is fine for MVP/beta. Just optimize it.**

