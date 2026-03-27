import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Attempting forced migration (killing other backends)...')
  try {
    // 1. Try to kill other backends to free up locks
    try {
      await prisma.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid();
      `)
      console.log('Other backends terminated.')
    } catch (err) {
      console.warn('Could not terminate other backends (might not have permission):', err)
    }

    // 2. Set very short lock timeout to bail quickly if blocked
    await prisma.$executeRawUnsafe(`SET lock_timeout = '5s';`)

    // 3. Add column
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='Post' AND column_name='buildingId';
    `)
    
    if (Array.isArray(checkColumn) && checkColumn.length === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD COLUMN "buildingId" INTEGER;`)
      console.log('Column "buildingId" added.')
    } else {
      console.log('Column "buildingId" already exists.')
    }

    // 4. Add index
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Post_buildingId_idx" ON "Post"("buildingId");`)
      console.log('Index added.')
    } catch (err) {
       console.log('Index add failed (might already exist):', err)
    }

    // 5. Add foreign key
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Post" ADD CONSTRAINT "Post_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL;`)
      console.log('Foreign key added.')
    } catch (err) {
       console.log('FK add failed (might already exist):', err)
    }

    console.log('Forced migration attempt finished.')
  } catch (e) {
    console.error('Detailed error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
