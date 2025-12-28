/**
 * Validate required environment variables
 * Call this on app startup
 */

export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'DATABASE_URL',
  ]

  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    )
  }

  // Validate Clerk keys format
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    console.warn('⚠️  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY should start with "pk_"')
  }
  
  if (process.env.CLERK_SECRET_KEY && !process.env.CLERK_SECRET_KEY.startsWith('sk_')) {
    console.warn('⚠️  CLERK_SECRET_KEY should start with "sk_"')
  }
}

