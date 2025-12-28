# Replit Deployment Guide

## 🎯 Replit-Specific Considerations

Replit has unique characteristics that require adjustments:

1. **Ephemeral File Storage** - Files in filesystem don't persist across restarts
2. **Environment Variables** - Use Replit Secrets tab
3. **Public Folder** - Served differently than traditional hosting
4. **Database** - SQLite may not persist (consider external DB)
5. **File Uploads** - Must use cloud storage (not local filesystem)

## ✅ Required Changes for Replit

### 1. **Use Cloud Storage for Resumes** (CRITICAL)

Replit's filesystem is ephemeral - files will be lost on restart. You MUST use cloud storage:

**Options:**
- **Cloudflare R2** (Recommended - Free tier, S3-compatible)
- **AWS S3** (Production-grade)
- **Vercel Blob** (Simple, serverless)
- **Supabase Storage** (Free tier available)

### 2. **Database Considerations**

SQLite in Replit may lose data on restart. Consider:
- **Supabase** (PostgreSQL, free tier)
- **Neon** (Serverless PostgreSQL, free tier)
- **PlanetScale** (MySQL, free tier)
- **Railway** (PostgreSQL, free tier)

Or keep SQLite but add regular backups.

### 3. **Environment Variables**

Use Replit Secrets tab (not `.env` files):
- Go to Secrets tab in Replit
- Add all required variables
- Access via `process.env.VARIABLE_NAME`

## 🚀 Quick Setup Steps

### Step 1: Install Dependencies

```bash
npm install @aws-sdk/client-s3  # For S3/R2
# OR
npm install @vercel/blob       # For Vercel Blob
```

### Step 2: Set Up Cloud Storage

**Option A: Cloudflare R2 (Recommended)**

1. Create Cloudflare account
2. Enable R2
3. Create bucket
4. Get credentials (Account ID, Access Key ID, Secret Access Key)
5. Add to Replit Secrets:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL` (if using public bucket)

**Option B: Vercel Blob**

1. Create Vercel account
2. Get Blob token
3. Add to Replit Secrets:
   - `BLOB_READ_WRITE_TOKEN`

### Step 3: Update Resume Upload

Use the cloud storage implementation (see `src/lib/resume-upload-cloud.ts`)

### Step 4: Environment Variables in Replit

Add to Replit Secrets:

```
NEXTAUTH_URL=https://your-repl-name.repl.co
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=your-database-url
OPENAI_API_KEY=your-openai-key
VAPI_PRIVATE_KEY=your-vapi-key
VAPI_PUBLIC_KEY=your-vapi-key

# Cloud Storage (choose one)
# For R2:
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# OR for Vercel Blob:
BLOB_READ_WRITE_TOKEN=your-blob-token
```

### Step 5: Update Database URL

If using external database:
- Update `DATABASE_URL` in Secrets
- Run migrations: `npx prisma migrate deploy`
- Generate client: `npx prisma generate`

## 📁 File Structure for Replit

```
.replit
├── .replit (Replit config)
└── replit.nix (if using Nix)

src/
├── lib/
│   ├── resume-upload-cloud.ts  # Cloud storage upload
│   └── resume-upload-secure.ts # Local (not for Replit)
```

## 🔧 Replit Configuration

### `.replit` File

```toml
run = "npm run dev"
entrypoint = "src/app/layout.tsx"

[nix]
channel = "stable-22_11"

[deploy]
run = ["sh", "-c", "npm run build && npm start"]
```

### `replit.nix` (if using Nix)

```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
  ];
}
```

## ⚠️ Important Notes

### 1. **File Persistence**
- ❌ Don't store files in `public/uploads/` (will be lost)
- ✅ Use cloud storage for all uploads
- ✅ Use external database for data persistence

### 2. **Environment Variables**
- ✅ Use Replit Secrets (not `.env` files)
- ✅ Secrets are encrypted and secure
- ✅ Access via `process.env.VARIABLE_NAME`

### 3. **Database**
- ⚠️ SQLite may lose data on restart
- ✅ Use external database for production
- ✅ Or implement regular backups

### 4. **Public Files**
- ✅ Static assets in `public/` work fine
- ❌ Don't store user uploads there
- ✅ Use cloud storage with CDN

### 5. **Build & Deploy**
- Replit auto-deploys on push
- Use `npm run build` for production builds
- Check Replit logs for errors

## 🐛 Troubleshooting

### Issue: Files disappear after restart
**Solution:** Use cloud storage, not local filesystem

### Issue: Database resets
**Solution:** Use external database (Supabase, Neon, etc.)

### Issue: Environment variables not working
**Solution:** 
- Check Replit Secrets tab
- Restart Replit after adding secrets
- Use `process.env.VARIABLE_NAME` (not `process.env['VARIABLE_NAME']`)

### Issue: Build fails
**Solution:**
- Check Node.js version (use 18+)
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`

## 📊 Replit-Specific Checklist

- [ ] Set up cloud storage (R2/S3/Blob)
- [ ] Add all env vars to Replit Secrets
- [ ] Use external database (or backup SQLite)
- [ ] Update resume upload to use cloud storage
- [ ] Test file upload/download
- [ ] Test OAuth flow
- [ ] Verify data persistence
- [ ] Set up monitoring (optional)

## 🚀 Deployment

1. **Push to GitHub** (if using Git)
2. **Replit auto-deploys** on push
3. **Or manually deploy** from Replit dashboard
4. **Check logs** for errors
5. **Test all features** after deployment

## 💡 Pro Tips

1. **Use Replit Database** (built-in) for simple data
2. **Use Supabase** for production-grade PostgreSQL
3. **Use Cloudflare R2** for free, S3-compatible storage
4. **Enable Replit Analytics** to monitor usage
5. **Set up GitHub integration** for version control

