// Script để hash password cho admin user
// Chạy: npx ts-node scripts/hash-admin-password.ts

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const phone = process.argv[2] || 'admin'
  const password = process.argv[3] || 'admin123'

  console.log(`🔐 Đang hash mật khẩu cho admin: ${phone}...`)

  const user = await prisma.user.findUnique({
    where: { phone }
  })

  if (!user) {
    console.error(`❌ Không tìm thấy user với số điện thoại: ${phone}`)
    process.exit(1)
  }

  if (user.role !== 'ADMIN') {
    console.error(`❌ User này không phải ADMIN`)
    process.exit(1)
  }

  // Check if already hashed
  const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
  
  if (isHashed) {
    console.log(`ℹ️  Password đã được hash rồi`)
    // Verify with provided password
    const isValid = await bcrypt.compare(password, user.password)
    if (isValid) {
      console.log(`✅ Password hiện tại đúng với: ${password}`)
    } else {
      console.log(`⚠️  Password hiện tại KHÔNG khớp với: ${password}`)
      console.log(`🔄 Đang hash password mới...`)
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      console.log(`✅ Đã cập nhật password mới: ${password}`)
    }
  } else {
    console.log(`🔄 Password chưa được hash, đang hash...`)
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })
    console.log(`✅ Đã hash password thành công: ${password}`)
  }

  console.log(`\n📋 Thông tin user:`)
  console.log(`   - Phone: ${user.phone}`)
  console.log(`   - Name: ${user.fullName}`)
  console.log(`   - Role: ${user.role}`)
  console.log(`\n🔑 Mật khẩu để đăng nhập: ${password}`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
