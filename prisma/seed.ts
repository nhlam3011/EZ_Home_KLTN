// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Bắt đầu tạo dữ liệu mẫu...')

  // 1. Tạo Admin
  const admin = await prisma.user.upsert({
    where: { phone: '0900000000' },
    update: {},
    create: {
      phone: '0900000000',
      password: 'admin', // Trong thực tế nhớ hash password
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: false,
    },
  })

  // 2. Tạo 50 Phòng (Tầng 1 - 5)
  const roomData = []
  for (let floor = 1; floor <= 5; floor++) {
    for (let num = 1; num <= 10; num++) {
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

  // 3. Tạo Dịch vụ mẫu
  await prisma.service.createMany({
    data: [
      { name: 'Điện', unitPrice: 3500, unit: 'kWh' },
      { name: 'Nước', unitPrice: 25000, unit: 'm3' },
      { name: 'Giặt ủi', unitPrice: 15000, unit: 'Kg' },
      { name: 'Dọn phòng', unitPrice: 50000, unit: 'Lần' },
    ],
    skipDuplicates: true
  })

  console.log('✅ Đã tạo dữ liệu thành công: 1 Admin, 50 Phòng, Dịch vụ mẫu.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })