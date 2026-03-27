import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    const formatted = posts.map(p => ({
      id: p.id,
      commentsCount: p._count.comments,
      content: p.content.substring(0, 20)
    }))

    console.log('Formatted Posts with Counts:', JSON.stringify(formatted, null, 2))

    // Check specific post 17 (which I know has a comment)
    const post17 = await prisma.post.findUnique({
        where: { id: 17 },
        include: { _count: { select: { comments: true } } }
    })
    console.log('Post 17 specific check:', post17)

  } catch (e) {
    console.error('Test error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
