/**
 * Quick script to apply the migration for systemPrompt and interviewState fields
 * Run with: node scripts/apply-migration.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Applying migration to add systemPrompt and interviewState fields...\n');

try {
    // Option 1: Try prisma db push (fastest for development)
    console.log('Attempting: npx prisma db push');
    execSync('npx prisma db push', { 
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    console.log('\n✅ Migration applied successfully!');
    console.log('Regenerating Prisma Client...');
    
    execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    console.log('\n✅ Prisma Client regenerated!');
    console.log('You can now use the new fields in your code.');
    
} catch (error) {
    console.error('\n❌ Migration failed. Trying alternative method...\n');
    
    // Option 2: Try migrate dev
    try {
        console.log('Attempting: npx prisma migrate dev');
        execSync('npx prisma migrate dev --name add_ai_state_fields', {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        console.log('\n✅ Migration applied successfully!');
    } catch (error2) {
        console.error('\n❌ Both methods failed.');
        console.error('\n📝 Manual fix required:');
        console.error('1. Open your database (prisma/dev.db)');
        console.error('2. Run these SQL commands:');
        console.error('   ALTER TABLE "InterviewSession" ADD COLUMN "systemPrompt" TEXT;');
        console.error('   ALTER TABLE "InterviewSession" ADD COLUMN "interviewState" TEXT;');
        console.error('3. Then run: npx prisma generate');
        process.exit(1);
    }
}

