// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Bắt đầu tạo dữ liệu mẫu...')

  // 1. Tạo Admin
  const hashedPassword = await hashPassword('admin')
  const admin = await prisma.user.upsert({
    where: { phone: '0900000000' },
    update: {},
    create: {
      phone: '0900000000',
      password: hashedPassword,
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: false,
    },
  })
  console.log('✅ Đã tạo Admin:', admin.phone)

  // 2. Tạo 20 Phòng (4 phòng/tầng, 5 tầng)
  const roomData = []
  for (let floor = 1; floor <= 5; floor++) {
    for (let num = 1; num <= 4; num++) {
      const roomName = `P.${floor}${num.toString().padStart(2, '0')}`
      roomData.push({
        name: roomName,
        floor: floor,
        price: floor === 1 ? 4000000 : 3500000,
        area: 25,
        maxPeople: 3,
        status: 'AVAILABLE'
      })
    }
  }
  await prisma.room.createMany({ data: roomData as any, skipDuplicates: true })
  console.log(`✅ Đã tạo ${roomData.length} phòng`)

  // 3. Tạo Dịch vụ mẫu
  const services = [
    { name: 'Điện', unitPrice: 3500, unit: 'kWh' },
    { name: 'Nước', unitPrice: 30000, unit: 'm3' },
    { name: 'Dịch vụ chung', unitPrice: 150000, unit: 'Người' },
    { name: 'Giặt ủi', unitPrice: 20000, unit: 'Kg' },
    { name: 'Dọn phòng', unitPrice: 50000, unit: 'Lần' },
    { name: 'Thay nước', unitPrice: 100000, unit: 'Lần' },
    { name: 'Thay bình ga', unitPrice: 350000, unit: 'Bình' },
    { name: 'Vệ sinh máy lạnh', unitPrice: 200000, unit: 'Lần' },
    { name: 'Sửa chữa điện nước', unitPrice: 150000, unit: 'Lần' },
  ]

  await prisma.service.createMany({
    data: services,
    skipDuplicates: true
  })
  console.log(`✅ Đã tạo ${services.length} dịch vụ mẫu`)

  console.log('\n✅ Hoàn thành! Đã tạo:')
  console.log(`   - 1 Admin (phone: 0900000000, password: admin)`)
  console.log(`   - ${roomData.length} Phòng`)
  console.log(`   - ${services.length} Dịch vụ mẫu`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })