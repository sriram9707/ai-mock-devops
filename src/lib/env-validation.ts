/**
 * Comprehensive Environment Variable Validation
 * Uses type-safe validation with runtime checks
 */

import { z } from 'zod'

// Define environment variable schema
const envSchema = z.object({
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_', {
    message: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with "pk_"'
  }),
  CLERK_SECRET_KEY: z.string().startsWith('sk_', {
    message: 'CLERK_SECRET_KEY must start with "sk_"'
  }),

  // Database
  DATABASE_URL: z.string().url({
    message: 'DATABASE_URL must be a valid database connection URL'
  }),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, {
    message: 'OPENAI_API_KEY is required'
  }).startsWith('sk-', {
    message: 'OPENAI_API_KEY must start with "sk-"'
  }),

  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().min(1, {
    message: 'ELEVENLABS_API_KEY is required'
  }),
  NEXT_PUBLIC_ELEVENLABS_AGENT_ID: z.string().min(1, {
    message: 'NEXT_PUBLIC_ELEVENLABS_AGENT_ID is required'
  }),

  // Server URL
  NEXT_PUBLIC_SERVER_URL: z.string().url({
    message: 'NEXT_PUBLIC_SERVER_URL must be a valid URL'
  }),

  // ChromaDB Vector Store
  CHROMA_URL: z.string().url().optional().or(z.literal('')),
  CHROMA_COLLECTION_NAME: z.string().optional().or(z.literal('')),
})

type Env = z.infer<typeof envSchema>

/**
 * Validate all required environment variables
 * Throws descriptive error if validation fails
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      NEXT_PUBLIC_ELEVENLABS_AGENT_ID: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
      QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
      QDRANT_COLLECTION_NAME: process.env.QDRANT_COLLECTION_NAME || '',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.issues.map((issue) => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('\n')
      throw new Error(
        `Environment variable validation failed:\n${missing}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      )
    }
    throw error
  }
}

/**
 * Get validated environment variables (use after validateEnv)
 * This provides type-safe access to env vars
 */
export function getEnv(): Env {
  // This will throw if validateEnv hasn't been called
  return envSchema.parse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      NEXT_PUBLIC_ELEVENLABS_AGENT_ID: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
    QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
    QDRANT_COLLECTION_NAME: process.env.QDRANT_COLLECTION_NAME || '',
  })
}

