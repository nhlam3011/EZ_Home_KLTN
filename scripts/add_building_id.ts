import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Adding buildingId to Post table...')
  try {
    await prisma.$executeRawUnsafe(`SET statement_timeout = '10s';`)
    // Check if column exists first to avoid double failure
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='Post' AND column_name='buildingId';
    `)
    
    if (Array.isArray(checkColumn) && checkColumn.length === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD COLUMN "buildingId" INTEGER;`)
      console.log('Column (field) added.')
    } else {
      console.log('Column already exists or check failed.')
    }

    // Add constraint if missing
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD CONSTRAINT "Post_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL;`)
      console.log('Foreign key constraint added.')
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log('Constraint already exists.')
      } else {
        throw err
      }
    }
    
    console.log('Manual migration attempt finished.')
  } catch (e) {
    console.error('Detailed error during manual migration:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
