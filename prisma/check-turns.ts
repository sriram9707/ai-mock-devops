
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const turns = await prisma.interviewTurn.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    })

    console.log("--- Recent Interview Turns ---")
    console.log(JSON.stringify(turns, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
