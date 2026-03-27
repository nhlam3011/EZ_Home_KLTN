import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const tableCheck = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Comment';
    `)
    console.log('Table "Comment" check:', tableCheck)

    const commentCount = await prisma.comment.count()
    console.log('Total comments in DB:', commentCount)

    const latestComments = await prisma.comment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    console.log('Latest 5 comments:', latestComments)

  } catch (e) {
    console.error('Error checking comments:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
