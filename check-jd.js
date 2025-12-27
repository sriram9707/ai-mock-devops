
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const sessions = await prisma.interviewSession.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { pack: true }
    })

    console.log("Scanning last 10 sessions for JD content...")

    let found = false
    for (const s of sessions) {
        const hasJD = !!s.jdRaw
        console.log(`[${s.createdAt.toISOString()}] ${s.pack.title} | JD: ${hasJD ? '✅' : '❌'}`)

        if (hasJD && !found) {
            console.log("\n--- MOST RECENT JD CONTENT ---")
            console.log(s.jdRaw)
            console.log("------------------------------\n")
            found = true
        }
    }

    if (!found) {
        console.log("\n⚠️ No JD content found in the last 10 sessions.")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
