// Script to check if Document model exists in database
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDocumentModel() {
  try {
    // Try to query the Document table
    const count = await prisma.document.count()
    console.log('✅ Document model exists! Count:', count)
    return true
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.error('❌ Document model does not exist in database')
      console.error('\n📋 Please run the following commands:')
      console.error('   1. npx prisma generate')
      console.error('   2. npx prisma db push')
      console.error('   OR')
      console.error('   npx prisma migrate deploy')
      return false
    }
    console.error('❌ Error checking Document model:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

checkDocumentModel()
