/**
 * Migration Script: Update existing orders to 2 attempts limit
 * 
 * This script updates all existing orders to have attemptsTotal = 2
 * to align with current requirements (2 attempts per pack purchase)
 * 
 * Run with: npx tsx prisma/migrate-orders-to-single-attempt.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Migrating orders to 2 attempts limit...')
    
    // Find all orders with attemptsTotal != 2
    const ordersToUpdate = await prisma.order.findMany({
        where: {
            OR: [
                { attemptsTotal: { lt: 2 } },
                { attemptsTotal: { gt: 2 } }
            ]
        }
    })

    console.log(`📊 Found ${ordersToUpdate.length} orders to update`)

    if (ordersToUpdate.length === 0) {
        console.log('✅ No orders need updating. All orders already have attemptsTotal = 2')
        return
    }

    // Update each order
    let updated = 0
    for (const order of ordersToUpdate) {
        // Set attemptsTotal to 2, but preserve attemptsUsed
        // If attemptsUsed >= 2, set attemptsTotal to attemptsUsed (so they can't use more)
        // If attemptsUsed < 2, set attemptsTotal to 2
        const newAttemptsTotal = order.attemptsUsed >= 2 ? order.attemptsUsed : 2

        await prisma.order.update({
            where: { id: order.id },
            data: {
                attemptsTotal: newAttemptsTotal
            }
        })
        updated++
        console.log(`  ✓ Updated order ${order.id}: attemptsTotal ${order.attemptsTotal} → ${newAttemptsTotal}`)
    }

    console.log(`\n✅ Migration complete! Updated ${updated} orders`)
    console.log('📝 All orders now have attemptsTotal = 2 (or equal to attemptsUsed if already used 2+)')
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

