# OAuth Setup Guide

## Production-Grade OAuth Implementation

This guide will help you set up Google OAuth authentication for the AI Mock Interview platform.

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install next-auth@beta @auth/prisma-adapter
   ```

2. **Database Migration**
   ```bash
   npx prisma migrate dev --name add_oauth_support
   ```

## Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API** (if not already enabled)
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth client ID**
6. Choose **Web application**
7. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**

### Step 2: Environment Variables

Create/update your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL="file:./dev.db"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 3: Run Database Migration

```bash
npx prisma migrate dev --name add_oauth_support
npx prisma generate
```

## Features Implemented

### ✅ OAuth Authentication
- Google OAuth integration
- Secure session management with database sessions
- Automatic user creation on first sign-in
- Default credits (3) assigned on signup

### ✅ User Profile Component
- Profile dropdown in top-right header
- Shows user avatar (from Google) or initials
- Displays user name and email
- Resume download link (if uploaded)
- Sign out functionality

### ✅ Secure Resume Upload
- File validation (PDF, DOC, DOCX only)
- Size limit (10MB)
- Secure file storage in `public/uploads/resumes/`
- User-specific file naming (prevents conflicts)
- Resume accessible from profile dropdown

### ✅ Onboarding Flow
- Works seamlessly with OAuth users
- Resume upload during onboarding
- Profile data saved to database
- Redirects to dashboard after completion

### ✅ Production-Grade Security
- Database-backed sessions (more secure than JWT)
- CSRF protection (built into NextAuth)
- Secure file upload validation
- User-specific file access control
- Middleware protection for routes

## File Structure

```
src/
├── auth.ts                          # NextAuth configuration
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts        # NextAuth API route
│   ├── login/
│   │   └── page.tsx                 # Updated login with OAuth
│   └── layout.tsx                   # Header integration
├── components/
│   ├── Header.tsx                   # Header with user profile
│   ├── UserProfile.tsx              # Profile dropdown component
│   └── Providers.tsx                # Session provider wrapper
└── lib/
    ├── auth.ts                      # Updated to use NextAuth
    ├── onboarding.ts                # Updated for OAuth
    └── resume-upload.ts             # Secure resume upload
```

## Testing

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test OAuth Flow**
   - Navigate to `/login`
   - Click "Continue with Google"
   - Complete Google OAuth flow
   - Should redirect to `/onboarding` (if first time) or `/dashboard`

3. **Test Profile**
   - After login, check top-right header
   - Click profile dropdown
   - Verify user info displays correctly
   - Test sign out

4. **Test Resume Upload**
   - Go through onboarding
   - Upload a resume (PDF/DOC/DOCX)
   - Verify it appears in profile dropdown

## Production Deployment

### Environment Variables (Production)

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
```

### Google OAuth Production Setup

1. Update authorized redirect URIs in Google Cloud Console:
   - `https://yourdomain.com/api/auth/callback/google`

2. Consider using environment-specific OAuth apps:
   - Development: `localhost` redirects
   - Production: Production domain redirects

### Resume Storage (Production)

For production, consider:
- **AWS S3** for scalable storage
- **Cloudflare R2** for cost-effective storage
- **Vercel Blob** for serverless storage

Update `src/lib/resume-upload.ts` to use your chosen storage solution.

## Security Best Practices

✅ **Implemented:**
- Database sessions (more secure than JWT)
- File type validation
- File size limits
- User-specific file naming
- CSRF protection (NextAuth)
- Secure cookie settings

⚠️ **Recommended for Production:**
- Use HTTPS only
- Implement rate limiting
- Add file virus scanning
- Use CDN for file serving
- Implement file access tokens
- Regular security audits

## Troubleshooting

### Issue: "Invalid redirect URI"
- Check Google Cloud Console redirect URIs
- Ensure `NEXTAUTH_URL` matches your domain
- Verify callback URL format: `/api/auth/callback/google`

### Issue: "Session not persisting"
- Check database connection
- Verify Prisma schema migration ran
- Check `NEXTAUTH_SECRET` is set

### Issue: "Resume upload fails"
- Check file size (max 10MB)
- Verify file type (PDF, DOC, DOCX only)
- Check `public/uploads/resumes/` directory permissions

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up Google OAuth credentials
3. ✅ Configure environment variables
4. ✅ Run database migration
5. ✅ Test OAuth flow
6. ✅ Deploy to production

## Support

For issues or questions:
- Check NextAuth.js docs: https://next-auth.js.org/
- Check Prisma docs: https://www.prisma.io/docs

