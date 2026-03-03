// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

// Helper function to generate random date in range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper to generate random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Vietnamese names for random generation (without diacritics for email)
const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huyenh', 'Vu', 'Dang', 'Bui', 'Do', 'Ngo', 'Ho', 'Phan', 'Truong', 'Vo']
const lastNames = ['An', 'Bao', 'Cuong', 'Dung', 'Hung', 'Khoa', 'Long', 'Minh', 'Nam', 'Phong', 'Quan', 'Son', 'Thanh', 'Trung', 'Tuan', 'Viet', 'Hoa', 'Hop', 'Mai', 'Lan', 'Huong', 'Thao', 'Ngoc', 'Linh', 'Trang', 'Huyen', 'Phuong', 'Thuy', 'Van']

// Room types with exact prices
const roomTypes = [
  { type: 'Studio', price: 3000000, area: 25, maxPeople: 2 },
  { type: '1N1K', price: 5000000, area: 45, maxPeople: 3 },
  { type: '2N1K', price: 6500000, area: 60, maxPeople: 5 }
]

// Services to create
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

// Issue titles for random generation
const issueTitles = [
  { title: 'Bóng đèn hỏng', description: 'Bóng đèn phòng không sáng' },
  { title: 'Vòi nước rỉ', description: 'Vòi nước bồn cầu bị rỉ nước' },
  { title: 'Điều hòa không lạnh', description: 'Máy điều hòa không hoạt động đúng công suất' },
  { title: 'Cửa kẹt', description: 'Cửa phòng mở và đóng khó khăn' },
  { title: 'Ổ cắm điện hỏng', description: 'Ổ cắm điện bị chập, không sử dụng được' },
  { title: 'Nóng lạnh không hoạt động', description: 'Máy nước nóng không nóng' },
  { title: 'Bình ga hết', description: 'Bình ga hết cần thay' },
  { title: 'Cầu dao điện nhảy', description: 'Điện bị nhảy liên tục' },
  { title: 'Cống thoát nước bị tắc', description: 'Nước thoát chậm hoặc không thoát' },
  { title: 'Két sắt hỏng', description: 'Không mở được két sắt' },
]

async function main() {
  console.log('🔄 Bắt đầu tạo dữ liệu mẫu hoàn chỉnh...')

  // 1. Tạo Admin
  console.log('\n📦 Tạo Admin...')
  const hashedPassword = await hashPassword('admin')
  const admin = await prisma.user.upsert({
    where: { phone: '0963304396' },
    update: {},
    create: {
      phone: '0963304396',
      password: hashedPassword,
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: false,
    },
  })
  console.log('   ✅ Admin:', admin.phone, '(password: admin)')

  // 2. Tạo 20 Phòng (5 tầng x 4 phòng)
  console.log('\n📦 Tạo 20 phòng (5 tầng, 3 loại phòng)...')
  const rooms = []
  const floors = [1, 2, 3, 4, 5]

  for (let floor of floors) {
    for (let num = 1; num <= 4; num++) {
      const roomName = `P.${floor}${num.toString().padStart(2, '0')}`

      // Assign room type in rotation: Studio, 1N1K, 2N1K, Studio...
      const typeIndex = ((floor - 1) * 4 + num - 1) % 3
      const roomType = roomTypes[typeIndex]

      // Random status: 15 rooms rented, 5 available
      const isRented = Math.random() < 0.75

      const room = await prisma.room.create({
        data: {
          name: roomName,
          floor: floor,
          price: roomType.price,
          area: roomType.area,
          maxPeople: roomType.maxPeople,
          roomType: roomType.type,
          status: isRented ? 'RENTED' : 'AVAILABLE',
          description: `Phòng ${roomType.type} tầng ${floor}, view ${floor % 2 === 1 ? 'mặt tiền' : 'sân'}`,
          amenities: roomType.type === 'Studio'
            ? ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi']
            : roomType.type === '1N1K'
              ? ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa']
              : ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Bàn ăn']
        }
      })
      rooms.push(room)
    }
  }
  console.log(`   ✅ Đã tạo ${rooms.length} phòng`)

  // 3. Tạo Dịch vụ mẫu
  console.log('\n📦 Tạo dịch vụ...')
  await prisma.service.createMany({
    data: services.map(s => ({ ...s, unitPrice: s.unitPrice })),
    skipDuplicates: true
  })
  console.log(`   ✅ Đã tạo ${services.length} dịch vụ`)

  // 4. Tạo cư dân và gán vào phòng
  console.log('\n📦 Tạo cư dân và hợp đồng...')
  const rentedRooms = rooms.filter(r => r.status === 'RENTED')
  const tenants = []

  for (let i = 0; i < rentedRooms.length; i++) {
    const room = rentedRooms[i]
    const firstName = firstNames[randomInt(0, firstNames.length - 1)]
    const lastName = lastNames[randomInt(0, lastNames.length - 1)]
    const fullName = `${firstName} ${lastName}`
    const phone = `09${randomInt(10000000, 99999999)}`

    // Create tenant user
    const tenant = await prisma.user.create({
      data: {
        phone: phone,
        password: hashedPassword,
        fullName: fullName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@gmail.com`,
        role: 'TENANT',
        isActive: true,
        isFirstLogin: false,
        dob: randomDate(new Date(1980, 0, 1), new Date(2000, 11, 31)),
        gender: Math.random() > 0.5 ? 'NAM' : 'NỮ',
        cccdNumber: `${randomInt(100000000, 999999999)}`,
        address: `${randomInt(1, 999)} Đường ${randomInt(1, 100)}, Quận ${randomInt(1, 12)}, TP.HCM`,
      }
    })
    tenants.push(tenant)

    // Create contract
    const startDate = randomDate(new Date(2024, 0, 1), new Date(2025, 11, 31))
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + randomInt(6, 24)) // 6-24 months

    // Some contracts are expired, some active
    const contractStatus = endDate < new Date() ? 'EXPIRED' : 'ACTIVE'

    const roomPrice = Number(room.price)

    const contract = await prisma.contract.create({
      data: {
        userId: tenant.id,
        roomId: room.id,
        startDate: startDate,
        endDate: endDate,
        deposit: roomPrice * 2, // 2 months deposit
        rentPrice: roomPrice,
        status: contractStatus
      }
    })

    // Create meter readings for last 6 months
    const now = new Date()
    for (let m = 5; m >= 0; m--) {
      const month = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const prevElec = randomInt(100, 500)
      const prevWater = randomInt(10, 50)

      await prisma.meterReading.create({
        data: {
          roomId: room.id,
          month: month.getMonth() + 1,
          year: month.getFullYear(),
          elecOld: prevElec - randomInt(30, 100),
          elecNew: prevElec,
          waterOld: prevWater - randomInt(3, 10),
          waterNew: prevWater
        }
      })
    }

    // Create invoices for last 3 months
    for (let m = 2; m >= 0; m--) {
      const invoiceDate = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const month = invoiceDate.getMonth() + 1
      const year = invoiceDate.getFullYear()

      const elecAmount = randomInt(200000, 800000)
      const waterAmount = randomInt(50000, 200000)
      const commonService = room.maxPeople * 150000
      const total = Number(room.price) + elecAmount + waterAmount + commonService

      // Random status: some paid, some unpaid, some overdue
      const rand = Math.random()
      let status: 'PAID' | 'UNPAID' | 'OVERDUE' = 'UNPAID'
      let paidAt = null

      if (rand < 0.5) {
        status = 'PAID'
        paidAt = randomDate(invoiceDate, new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000))
      } else if (rand < 0.7) {
        status = 'OVERDUE'
      }

      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + 5) // Due 5 days after month start

      await prisma.invoice.create({
        data: {
          contractId: contract.id,
          month: month,
          year: year,
          amountRoom: room.price,
          amountElec: elecAmount,
          amountWater: waterAmount,
          amountCommonService: commonService,
          amountService: 0,
          totalAmount: total,
          status: status,
          paymentDueDate: dueDate,
          paidAt: paidAt
        }
      })
    }

    // Create some issues randomly
    if (Math.random() < 0.4) {
      const issue = issueTitles[randomInt(0, issueTitles.length - 1)]
      await prisma.issue.create({
        data: {
          userId: tenant.id,
          roomId: room.id,
          title: issue.title,
          description: issue.description,
          status: randomInt(0, 2) === 0 ? 'PENDING' : randomInt(0, 1) === 0 ? 'PROCESSING' : 'DONE',
          createdAt: randomDate(new Date(2025, 0, 1), new Date())
        }
      })
    }

    // Create service orders randomly
    if (Math.random() < 0.3) {
      const serviceNames = ['Giặt ủi', 'Dọn phòng', 'Vệ sinh máy lạnh']
      const serviceName = serviceNames[randomInt(0, serviceNames.length - 1)]
      const service = await prisma.service.findFirst({ where: { name: serviceName } })

      if (service) {
        const quantity = randomInt(1, 5)
        await prisma.serviceOrder.create({
          data: {
            userId: tenant.id,
            serviceId: service.id,
            quantity: quantity,
            total: Number(service.unitPrice) * quantity,
            note: `Yêu cầu dịch vụ ${serviceName}`,
            status: randomInt(0, 1) === 0 ? 'PENDING' : 'DONE',
            orderDate: randomDate(new Date(2025, 0, 1), new Date())
          }
        })
      }
    }
  }

  console.log(`   ✅ Đã tạo ${tenants.length} cư dân với hợp đồng`)

  // 5. Tạo bài đăng cộng đồng
  console.log('\n📦 Tạo bài đăng cộng đồng...')
  const postContents = [
    'Chào mọi người, tôi mới chuyển vào P.101, rất vui được làm quen!',
    'Có ai muốn mua gói giặt ủi không? Giá ưu đãi lắm!',
    'Tìm người chơi cầu lông vào Chủ Nhật hàng tuần, ai quan tâm inbox mình nhé!',
    'Cảm ơn bác bảo vệ đã giúp đỡ hôm qua, rất nhiệt tình!',
    'Khuya nhiều người đi cầu thang gây ồn quá, mong mọi người chú ý giữ yên lặng!',
    'Có ai biết thợ sửa điều hòa nào uy tín không? Máy phòng mình bị hỏng rồi!',
    'Chúc mọi người một tuần mới vui vẻ!',
    'Khu vực để xe có ai để quên chai nước không? Liên hệ mình nhé!',
  ]

  for (let i = 0; i < 8; i++) {
    const tenant = tenants[randomInt(0, tenants.length - 1)]
    await prisma.post.create({
      data: {
        userId: tenant.id,
        content: postContents[i],
        status: 'PUBLIC',
        createdAt: randomDate(new Date(2025, 0, 1), new Date())
      }
    })
  }
  console.log(`   ✅ Đã tạo 8 bài đăng cộng đồng`)

  // 6. Tạo tin nhắn mẫu
  console.log('\n📦 Tạo tin nhắn...')
  const messageContents = [
    'Chào anh/chị, em có thắc mắc về hóa đơn tháng này...',
    'Cảm ơn anh/chị đã phản hồi nhanh!',
    'Em sẽ thanh toán hóa đơn vào ngày mai ạ.',
    'Khi nào có lịch bảo trì điều hòa ạ?',
    'Phòng em có vấn đề về điện, mong được hỗ trợ!',
  ]

  for (let i = 0; i < 5; i++) {
    const tenant = tenants[randomInt(0, tenants.length - 1)]
    await prisma.message.create({
      data: {
        senderId: tenant.id,
        receiverId: admin.id,
        content: messageContents[i],
        isRead: Math.random() > 0.5,
        createdAt: randomDate(new Date(2025, 0, 1), new Date())
      }
    })
  }
  console.log(`   ✅ Đã tạo 5 tin nhắn`)

  // 7. Tạo một số phòng trống có sẵn
  console.log('\n📦 Tạo các phòng trống mẫu...')
  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE')
  console.log(`   ✅ Có ${availableRooms.length} phòng trống sẵn sàng cho thuê`)

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('✅ HOÀN THÀNH! Đã tạo:')
  console.log('='.repeat(50))
  console.log(`   👤 1 Admin (phone: 0900000000, password: admin)`)
  console.log(`   🏠 ${rooms.length} Phòng (${rentedRooms.length} đã thuê, ${availableRooms.length} trống)`)
  console.log(`   👥 ${tenants.length} Cư dân`)
  console.log(`   📄 ${tenants.length} Hợp đồng`)
  console.log(`   📊 ${tenants.length * 3} Hóa đơn`)
  console.log(`   ⚡ ${rooms.length * 6} Chỉ số điện nước`)
  console.log(`   🔧 ${rentedRooms.length * 0.4 | 0} Sự cố/bảo trì`)
  console.log(`   🧹 ${rentedRooms.length * 0.3 | 0} Đơn dịch vụ`)
  console.log(`   📝 8 Bài đăng cộng đồng`)
  console.log(`   💬 5 Tin nhắn`)
  console.log(`   🛠️ ${services.length} Dịch vụ`)
  console.log('='.repeat(50))
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
