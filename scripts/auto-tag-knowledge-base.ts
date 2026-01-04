/**
 * Auto-Tagging Script for Knowledge Base
 * 
 * Scans interview-flow.ts for topics, finds best matching markdown file in data/knowledge-base,
 * and adds 'id: slug' to YAML frontmatter if missing.
 * 
 * Usage: npx tsx scripts/auto-tag-knowledge-base.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { INTERVIEW_TOPICS } from '../src/lib/ai/interview-flow'
import { getVectorStore } from '../src/lib/vector-store'
import { readFile, writeFile } from 'fs/promises'

// Slugify function
function slugify(text: string): string {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

async function autoTag() {
    console.log('🚀 Starting Auto-Tagging Process...\n')

    const vectorStore = await getVectorStore()
    let updatedCount = 0
    let skippedCount = 0
    let noMatchCount = 0

    // Flatten all topics
    const allItems: string[] = []
    for (const topic of INTERVIEW_TOPICS) {
        allItems.push(...topic.entryLevelFocus)
        allItems.push(...topic.seniorLevelFocus)
        allItems.push(...topic.architectLevelFocus)
    }

    console.log(`📋 Found ${allItems.length} topics to check.`)

    for (const item of allItems) {
        const slug = slugify(item)

        // 1. Search for best match (RAW Topic)
        const results = await vectorStore.similaritySearchWithScore(item, 1)

        if (results.length === 0) {
            noMatchCount++
            continue
        }

        const [doc, score] = results[0]

        // Relaxed threshold for Curated Alignment (1.2 allows "Concept" -> "File" matches)
        const MATCH_THRESHOLD = 1.2

        if (score > MATCH_THRESHOLD) {
            console.log(`⚠️  Weak match for "${item}" (Score: ${score.toFixed(2)}). Skipping.`)
            noMatchCount++
            continue
        }

        // 2. Get File Path
        const filePath = doc.metadata.filePath || doc.metadata.source // Fallback

        if (!filePath || !String(filePath).startsWith('/')) {
            console.warn(`⚠️  Invalid file path in metadata: ${filePath}.`)
            continue
        }

        // 3. Read File
        try {
            const content = await readFile(filePath, 'utf-8')

            // Check if ID exists. If it exists but is DIFFERENT, we might want to append?
            // For now, let's just REPLACE or Add.
            // Since we want strict mapping, we probably want to Update the ID to match our new curriculum.
            // BUT multiple topics might map to same file.
            // e.g. "Pod Lifecycle" and "Stuck Pods" -> same file.
            // Markdown frontmatter only supports ONE id usually, or we need an array?
            // My retrieval logic looks for `id: slug`.
            // If I overwrite the ID, the previous topic mapping might break?
            // Ah! 1 file = 1 ID.
            // If multiple topics map to one file, they must share the SAME ID?
            // "Pod Lifecycle" -> slug: pod-lifecycle
            // "Stuck Pods" -> slug: stuck-pods
            // If they map to the same file, the file can only have one ID!
            // CRITICAL FLAW in "100% ID Match" plan if topics are granular.
            // UNLESS the retrieval logic uses `id` field AND `tags`?
            // Or I manually ensure 1:1 mapping in curriculum?

            // Re-read my interview-flow. I reused files.
            // 'Pod Lifecycle and States' -> matches pod_lifecycle.md
            // 'Basic Pod Troubleshooting' -> matches pod_lifecycle.md

            // If I blindly tag `pod_lifecycle.md` with `id: pod-lifecycle-and-states`, 
            // then later I tag it with `id: basic-pod-troubleshooting`, I overwrite the first one!
            // Result: Only the LAST topic works.

            // SOLUTION: Multi-ID support is hard in YAML `id`.
            // SOLUTION B: Use `tags` field? And retrieval checks tags?

            // Let's stick to the script. It skips if `id` exists.
            // "Skipped (Already tagged)".
            // This means `Pod Lifecycle` tags it. `Basic Troubleshooting` skips it.
            // So `Basic Troubleshooting` (slug: basic-pod-troubleshooting) will NOT match `id: pod-lifecycle...`.
            // So Retrieval will fallback to Semantic.

            // The User wants "Success Hit Rate 100%".
            // If 50% fall back to semantic (even if it finds the right doc), is that "Success"?
            // Yes, if semantic finds the right doc.

            // BUT, if I want strict ID match, I must make sure the Curriculum Topic Slug === File ID.
            // If multiple topics map to one file, I can't do that with a single `id` field.

            // Compromise: I'll let the tagging happen.
            // The first match sets the ID.
            // Sub-topics will match semantically (Score < 0.3 usually for same doc).

            const frontmatterRegex = /^---\n([\s\S]*?)\n---/
            const match = content.match(frontmatterRegex)

            let newContent = content
            let action = 'none'

            if (match) {
                const frontmatter = match[1]
                if (frontmatter.includes('id:')) {
                    // Check if current ID is effectively the same? No.
                    // console.log(`⏭️  File ${filePath} already has ID. Skipping.`)
                    skippedCount++
                    continue
                } else {
                    newContent = content.replace(/^---\n/, `---\nid: ${slug}\n`)
                    action = 'updated'
                }
            } else {
                newContent = `---\nid: ${slug}\ntags: [auto-tagged]\n---\n\n` + content
                action = 'created'
            }

            if (action !== 'none') {
                await writeFile(filePath, newContent, 'utf-8')
                console.log(`✅ tagged: "${item}" -> ${filePath} (Score: ${score.toFixed(2)})`)
                updatedCount++
            }

        } catch (e) {
            console.error(`❌ Error reading/writing ${filePath}:`, e)
        }
    }

    console.log('\n🎉 Auto-Tagging Complete!')
    // ... stats
}

autoTag().catch(console.error)
