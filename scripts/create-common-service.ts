// Script tạo dịch vụ chung
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Đang tạo dịch vụ chung...')

  // Kiểm tra xem dịch vụ đã tồn tại chưa
  const existingService = await prisma.service.findFirst({
    where: {
      OR: [
        { name: { contains: 'Dịch vụ chung', mode: 'insensitive' } },
        { name: { contains: 'Phí dịch vụ chung', mode: 'insensitive' } }
      ]
    }
  })

  if (existingService) {
    console.log('Dịch vụ chung đã tồn tại:', existingService)
    
    // Cập nhật giá nếu khác
    if (Number(existingService.unitPrice) !== 150000) {
      await prisma.service.update({
        where: { id: existingService.id },
        data: {
          unitPrice: 150000,
          unit: 'người',
          isActive: true
        }
      })
      console.log('Đã cập nhật giá dịch vụ chung thành 150,000 VND/người')
    } else {
      console.log('Dịch vụ chung đã có giá đúng: 150,000 VND/người')
    }
  } else {
    // Tạo mới dịch vụ chung
    const service = await prisma.service.create({
      data: {
        name: 'Dịch vụ chung',
        unitPrice: 150000,
        unit: 'người',
        isActive: true
      }
    })
    console.log('Đã tạo dịch vụ chung thành công:', service)
    console.log('Tên:', service.name)
    console.log('Đơn giá:', service.unitPrice, 'VND')
    console.log('Đơn vị:', service.unit)
  }
}

main()
  .catch((e) => {
    console.error('Lỗi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
