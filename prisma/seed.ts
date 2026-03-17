// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

const ELEC_PRICE = 3500
const WATER_PRICE = 30000
const COMMON_SERVICE_PRICE = 150000

// 19 khách thuê cố định
const tenantsData = [
  {
    phone: '0912345001', fullName: 'Nguyễn Văn An', email: 'an.nguyen01@gmail.com', gender: 'NAM', dob: '1995-03-15', cccd: '079095001234', address: '123 Lê Lợi, Q.1, TP.HCM', job: 'Kỹ sư phần mềm', licensePlate: '59A-12345',
    occupants: [{ fullName: 'Trần Thị Bích', cccd: '079096005678', phone: '0912345101', relationship: 'Vợ', dob: '1996-07-20' }]
  },
  { phone: '0912345002', fullName: 'Trần Minh Đức', email: 'duc.tran02@gmail.com', gender: 'NAM', dob: '1993-08-22', cccd: '079093002345', address: '456 Nguyễn Huệ, Q.1, TP.HCM', job: 'Nhân viên ngân hàng', licensePlate: '59B-23456', occupants: [] },
  { phone: '0912345003', fullName: 'Lê Thị Hồng', email: 'hong.le03@gmail.com', gender: 'NỮ', dob: '1998-01-10', cccd: '079098003456', address: '789 Trần Hưng Đạo, Q.5, TP.HCM', job: 'Giáo viên', occupants: [] },
  {
    phone: '0912345004', fullName: 'Phạm Quốc Bảo', email: 'bao.pham04@gmail.com', gender: 'NAM', dob: '1990-11-05', cccd: '079090004567', address: '12 Võ Văn Tần, Q.3, TP.HCM', job: 'Bác sĩ', licensePlate: '59C-34567',
    occupants: [{ fullName: 'Nguyễn Thị Mai', cccd: '079092008901', phone: '0912345104', relationship: 'Vợ', dob: '1992-04-18' },
    { fullName: 'Phạm Gia Huy', phone: '0912345204', relationship: 'Con', dob: '2018-09-01' }]
  },
  { phone: '0912345005', fullName: 'Hoàng Thị Lan', email: 'lan.hoang05@gmail.com', gender: 'NỮ', dob: '1997-06-28', cccd: '079097005678', address: '34 Pasteur, Q.3, TP.HCM', job: 'Nhân viên marketing', occupants: [] },
  { phone: '0912345006', fullName: 'Vũ Đình Khoa', email: 'khoa.vu06@gmail.com', gender: 'NAM', dob: '1994-02-14', cccd: '079094006789', address: '56 Điện Biên Phủ, Bình Thạnh, TP.HCM', job: 'Lập trình viên', licensePlate: '59D-45678', occupants: [] },
  {
    phone: '0912345007', fullName: 'Đặng Thanh Tùng', email: 'tung.dang07@gmail.com', gender: 'NAM', dob: '1991-09-30', cccd: '079091007890', address: '78 Cách Mạng Tháng 8, Q.10, TP.HCM', job: 'Kiến trúc sư', licensePlate: '59E-56789',
    occupants: [{ fullName: 'Lê Thị Hạnh', cccd: '079093009012', phone: '0912345107', relationship: 'Vợ', dob: '1993-12-25' }]
  },
  { phone: '0912345008', fullName: 'Bùi Thị Ngọc', email: 'ngoc.bui08@gmail.com', gender: 'NỮ', dob: '1999-04-07', cccd: '079099008901', address: '90 Lý Thường Kiệt, Q.Tân Bình, TP.HCM', job: 'Sinh viên', occupants: [] },
  { phone: '0912345009', fullName: 'Đỗ Hoàng Nam', email: 'nam.do09@gmail.com', gender: 'NAM', dob: '1992-12-20', cccd: '079092009012', address: '123 Phan Đăng Lưu, Phú Nhuận, TP.HCM', job: 'Kế toán', licensePlate: '59F-67890', occupants: [] },
  {
    phone: '0912345010', fullName: 'Ngô Thị Phương', email: 'phuong.ngo10@gmail.com', gender: 'NỮ', dob: '1996-05-11', cccd: '079096010123', address: '45 Hai Bà Trưng, Q.1, TP.HCM', job: 'Dược sĩ',
    occupants: [{ fullName: 'Trần Văn Hùng', cccd: '079094011234', phone: '0912345110', relationship: 'Chồng', dob: '1994-08-03' }]
  },
  { phone: '0912345011', fullName: 'Hồ Minh Trí', email: 'tri.ho11@gmail.com', gender: 'NAM', dob: '1988-07-16', cccd: '079088011234', address: '67 Nguyễn Thị Minh Khai, Q.3, TP.HCM', job: 'Quản lý nhà hàng', licensePlate: '59G-78901', occupants: [] },
  { phone: '0912345012', fullName: 'Phan Thị Thuỷ', email: 'thuy.phan12@gmail.com', gender: 'NỮ', dob: '2000-10-02', cccd: '079000012345', address: '89 Lê Văn Sỹ, Q.3, TP.HCM', job: 'Nhân viên văn phòng', occupants: [] },
  {
    phone: '0912345013', fullName: 'Trương Văn Long', email: 'long.truong13@gmail.com', gender: 'NAM', dob: '1989-03-25', cccd: '079089013456', address: '101 Sư Vạn Hạnh, Q.10, TP.HCM', job: 'Tài xế công nghệ', licensePlate: '59H-89012',
    occupants: [{ fullName: 'Nguyễn Thị Linh', cccd: '079091014567', phone: '0912345113', relationship: 'Vợ', dob: '1991-06-14' },
    { fullName: 'Trương Minh Khôi', phone: '0912345213', relationship: 'Con', dob: '2020-01-10' }]
  },
  { phone: '0912345014', fullName: 'Võ Thanh Sơn', email: 'son.vo14@gmail.com', gender: 'NAM', dob: '1995-08-08', cccd: '079095014567', address: '202 Nguyễn Văn Cừ, Q.5, TP.HCM', job: 'Thợ điện', licensePlate: '59K-90123', occupants: [] },
  { phone: '0912345015', fullName: 'Lê Thị Huyền', email: 'huyen.le15@gmail.com', gender: 'NỮ', dob: '1997-11-19', cccd: '079097015678', address: '303 Trường Chinh, Tân Phú, TP.HCM', job: 'Nhân viên bán hàng', occupants: [] },
  { phone: '0912345016', fullName: 'Nguyễn Hữu Phong', email: 'phong.nguyen16@gmail.com', gender: 'NAM', dob: '1993-01-30', cccd: '079093016789', address: '404 Âu Cơ, Tân Bình, TP.HCM', job: 'Nhiếp ảnh gia', licensePlate: '59L-01234', occupants: [] },
  {
    phone: '0912345017', fullName: 'Trần Thị Trang', email: 'trang.tran17@gmail.com', gender: 'NỮ', dob: '1998-09-12', cccd: '079098017890', address: '505 Hoàng Văn Thụ, Phú Nhuận, TP.HCM', job: 'Thiết kế đồ hoạ',
    occupants: [{ fullName: 'Lê Văn Tú', cccd: '079096018901', phone: '0912345117', relationship: 'Bạn cùng phòng', dob: '1996-02-28' }]
  },
  { phone: '0912345018', fullName: 'Huỳnh Quang Vinh', email: 'vinh.huynh18@gmail.com', gender: 'NAM', dob: '1991-04-04', cccd: '079091018901', address: '606 Lạc Long Quân, Q.11, TP.HCM', job: 'Nhân viên IT', licensePlate: '59M-12345', occupants: [] },
  { phone: '0912345019', fullName: 'Phạm Thị Diễm', email: 'diem.pham19@gmail.com', gender: 'NỮ', dob: '1999-12-01', cccd: '079099019012', address: '707 Nguyễn Oanh, Gò Vấp, TP.HCM', job: 'Y tá', occupants: [] },
]

// Gán phòng cho 19 khách - phòng RENTED, còn lại AVAILABLE
// 20 phòng: P.101-P.104, P.201-P.204, ..., P.501-P.504
// 19 phòng thuê, 1 phòng trống (P.504)
const rentedRoomIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] // 19 phòng đầu

const roomTypes = [
  { type: 'Studio', price: 3000000, area: 25, maxPeople: 2 },
  { type: '1N1K', price: 5000000, area: 45, maxPeople: 3 },
  { type: '2N1K', price: 6500000, area: 60, maxPeople: 5 }
]

// Thời hạn hợp đồng cho từng khách (3, 6, 12 tháng)
const contractDurations = [12, 6, 3, 12, 6, 12, 6, 3, 12, 6, 12, 3, 6, 12, 3, 6, 12, 6, 3]

// Số điện nước sử dụng hàng tháng (phù hợp thực tế)
// [elecUsage, waterUsage] - điện (kWh), nước (m3)
// Tháng 10,11,12/2025, 1,2,3/2026
function getMonthlyUsage(roomTypeStr: string, month: number): [number, number] {
  // Mùa nóng (3-5): điện cao hơn, mùa mát (10-12): điện thấp hơn
  const isHotSeason = month >= 3 && month <= 8
  const base = roomTypeStr === 'Studio' ? { elec: 80, water: 4 }
    : roomTypeStr === '1N1K' ? { elec: 140, water: 7 }
      : { elec: 200, water: 11 }

  const elecVariation = Math.floor(Math.random() * 30) - 10
  const waterVariation = Math.floor(Math.random() * 3) - 1
  const seasonMultiplier = isHotSeason ? 1.3 : 1.0

  return [
    Math.round((base.elec + elecVariation) * seasonMultiplier),
    Math.max(2, base.water + waterVariation)
  ]
}

const services = [
  { name: 'Điện', unitPrice: 3500, unit: 'kWh' },
  { name: 'Nước', unitPrice: 30000, unit: 'm3' },
  { name: 'Dịch vụ chung', unitPrice: 150000, unit: 'Người' },
  { name: 'Giặt ủi', unitPrice: 20000, unit: 'Kg' },
  { name: 'Dọn phòng', unitPrice: 50000, unit: 'Lần' },
  { name: 'Thay bình ga', unitPrice: 350000, unit: 'Bình' },
  { name: 'Vệ sinh máy lạnh', unitPrice: 200000, unit: 'Lần' },
  { name: 'Sửa chữa điện nước', unitPrice: 150000, unit: 'Lần' },
]

// Issues (Đơn bảo trì sự cố)
const issuesData = [
  { tenantIdx: 0, title: 'Điều hòa không lạnh', desc: 'Máy điều hòa phòng ngủ chạy nhưng không mát, có tiếng kêu lạ', status: 'DONE' as const, cost: 350000, date: '2025-11-15' },
  { tenantIdx: 2, title: 'Vòi nước rỉ', desc: 'Vòi nước bồn rửa mặt bị rỉ nước liên tục, gây lãng phí', status: 'DONE' as const, cost: 150000, date: '2025-11-20' },
  { tenantIdx: 4, title: 'Bóng đèn hỏng', desc: 'Đèn trần phòng khách không sáng, đã thử thay bóng nhưng vẫn không được', status: 'DONE' as const, cost: 80000, date: '2025-12-05' },
  { tenantIdx: 6, title: 'Cống thoát nước bị tắc', desc: 'Nước trong nhà tắm thoát rất chậm, có mùi hôi', status: 'DONE' as const, cost: 200000, date: '2025-12-18' },
  { tenantIdx: 8, title: 'Ổ cắm điện hỏng', desc: 'Ổ cắm điện gần bàn làm việc bị chập, có tia lửa khi cắm', status: 'PROCESSING' as const, cost: 120000, date: '2026-01-10' },
  { tenantIdx: 10, title: 'Cửa kẹt', desc: 'Cửa phòng ngủ mở và đóng rất khó khăn, bản lề bị lệch', status: 'DONE' as const, cost: 100000, date: '2026-01-25' },
  { tenantIdx: 1, title: 'Nóng lạnh không hoạt động', desc: 'Máy nước nóng không nóng, đã kiểm tra điện vẫn có', status: 'PROCESSING' as const, cost: null, date: '2026-02-08' },
  { tenantIdx: 12, title: 'Cầu dao điện nhảy', desc: 'Cầu dao tổng nhảy liên tục khi bật điều hòa và bình nóng lạnh cùng lúc', status: 'DONE' as const, cost: 250000, date: '2026-02-15' },
  { tenantIdx: 5, title: 'Bồn cầu bị nghẹt', desc: 'Bồn cầu xả nước yếu và bị nghẹt', status: 'PENDING' as const, cost: null, date: '2026-03-05' },
  { tenantIdx: 14, title: 'Tường bị thấm nước', desc: 'Tường phòng ngủ bị thấm nước khi trời mưa, ẩm mốc', status: 'PENDING' as const, cost: null, date: '2026-03-10' },
  { tenantIdx: 3, title: 'Khóa cửa hỏng', desc: 'Khóa cửa chính bị kẹt, không thể khóa từ bên ngoài', status: 'PENDING' as const, cost: null, date: '2026-03-15' },
  { tenantIdx: 16, title: 'Quạt trần kêu to', desc: 'Quạt trần phòng khách kêu rất to khi chạy ở tốc độ cao', status: 'PROCESSING' as const, cost: null, date: '2026-03-12' },
]

// Bài viết cộng đồng
const postsData = [
  { tenantIdx: 0, content: 'Xin chào mọi người! Mình mới dọn vào tầng 1, rất vui được làm quen với tất cả. Mọi người cần gì cứ nhắn mình nhé 😊', status: 'PUBLIC', date: '2025-10-20' },
  { tenantIdx: 3, content: 'Cuối tuần này mình tổ chức BBQ ở sân thượng, ai muốn tham gia thì đăng ký với mình nha! 🥩🔥', status: 'PUBLIC', date: '2025-11-08' },
  { tenantIdx: 7, content: 'Có ai biết quán phở ngon gần đây không ạ? Mình mới chuyển đến chưa quen khu vực 🍜', status: 'PUBLIC', date: '2025-11-15' },
  { tenantIdx: 5, content: 'Nhờ mọi người giữ yên lặng sau 22h nhé, mình phải dậy sớm đi làm. Cảm ơn mọi người! 🙏', status: 'PUBLIC', date: '2025-12-01' },
  { tenantIdx: 10, content: 'Cảm ơn ban quản lý đã sửa nhanh cửa phòng mình. Dịch vụ rất tốt! ⭐⭐⭐⭐⭐', status: 'PUBLIC', date: '2026-01-28' },
  { tenantIdx: 2, content: 'Mình có mấy chậu cây xanh muốn tặng, ai cần thì liên hệ mình nhé 🌿🪴', status: 'PUBLIC', date: '2026-02-05' },
  { tenantIdx: 15, content: 'Có ai muốn chơi cầu lông vào sáng Chủ Nhật không? Sân gần toà nhà mình, 50k/giờ, chia đôi nha! 🏸', status: 'PUBLIC', date: '2026-02-20' },
  { tenantIdx: 8, content: 'Khu vực để xe tầng hầm ai để quên 1 cái mũ bảo hiểm màu đen không? Liên hệ mình nhé!', status: 'PUBLIC', date: '2026-03-01' },
  { tenantIdx: 13, content: 'Chúc mọi người ngày Quốc tế Phụ nữ 8/3 vui vẻ! 🌸💐 Chúc các chị em luôn xinh đẹp và hạnh phúc!', status: 'PUBLIC', date: '2026-03-08' },
  { tenantIdx: 17, content: 'Wifi tầng 3 hôm nay chập chờn quá, có ai bị giống mình không? 📶', status: 'PUBLIC', date: '2026-03-14' },
  { tenantIdx: 1, content: 'Mình đang tìm người share phí Netflix, ai quan tâm inbox mình nha! 📺', status: 'PENDING', date: '2026-03-16' },
]

async function main() {
  console.log('🔄 Bắt đầu tạo dữ liệu mẫu...')

  // 1. Admin
  const hashedAdmin = await hashPassword('admin')
  const admin = await prisma.user.upsert({
    where: { phone: '0963304396' },
    update: {},
    create: {
      phone: '0963304396', password: hashedAdmin, fullName: 'Quản Trị Viên',
      role: 'ADMIN', isActive: true, isFirstLogin: false,
      email: 'admin@ezhome.vn', gender: 'NAM',
    },
  })
  console.log('✅ Admin:', admin.phone)

  // 2. Tạo 20 Phòng
  console.log('📦 Tạo 20 phòng...')
  const rooms = []
  for (let floor = 1; floor <= 5; floor++) {
    for (let num = 1; num <= 4; num++) {
      const idx = (floor - 1) * 4 + (num - 1)
      const typeIndex = idx % 3
      const rt = roomTypes[typeIndex]
      const isRented = rentedRoomIndices.includes(idx)
      const room = await prisma.room.create({
        data: {
          name: `P.${floor}${num.toString().padStart(2, '0')}`,
          floor, price: rt.price, area: rt.area, maxPeople: rt.maxPeople,
          roomType: rt.type,
          status: isRented ? 'RENTED' : 'AVAILABLE',
          description: `Phòng ${rt.type} tầng ${floor}, ${floor <= 2 ? 'view mặt tiền' : floor <= 4 ? 'view sân vườn' : 'view toàn cảnh'}`,
          amenities: rt.type === 'Studio'
            ? ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi']
            : rt.type === '1N1K'
              ? ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt']
              : ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Bàn ăn', 'Máy giặt']
        }
      })
      rooms.push(room)
    }
  }
  console.log(`✅ ${rooms.length} phòng`)

  // 3. Dịch vụ
  await prisma.service.createMany({ data: services.map(s => ({ ...s })), skipDuplicates: true })
  console.log(`✅ ${services.length} dịch vụ`)

  // 4. Tạo Assets cho phòng
  console.log('📦 Tạo tài sản phòng...')
  const assetTemplates: Record<string, { name: string; category: string; value: number }[]> = {
    'Studio': [
      { name: 'Điều hòa Daikin 1HP', category: 'Điện máy', value: 8000000 },
      { name: 'Bình nóng lạnh Ariston 15L', category: 'Điện máy', value: 3500000 },
      { name: 'Tủ lạnh Aqua 90L', category: 'Điện máy', value: 3000000 },
      { name: 'Giường đôi 1m6', category: 'Nội thất', value: 4000000 },
      { name: 'Tủ quần áo 2 cánh', category: 'Nội thất', value: 2500000 },
    ],
    '1N1K': [
      { name: 'Điều hòa Daikin 1.5HP', category: 'Điện máy', value: 10000000 },
      { name: 'Bình nóng lạnh Ariston 20L', category: 'Điện máy', value: 4000000 },
      { name: 'Tủ lạnh Samsung 200L', category: 'Điện máy', value: 6000000 },
      { name: 'Máy giặt Electrolux 7.5kg', category: 'Điện máy', value: 7000000 },
      { name: 'Giường đôi 1m8', category: 'Nội thất', value: 5000000 },
      { name: 'Sofa 2 chỗ', category: 'Nội thất', value: 3500000 },
    ],
    '2N1K': [
      { name: 'Điều hòa Daikin 2HP', category: 'Điện máy', value: 14000000 },
      { name: 'Điều hòa Daikin 1HP', category: 'Điện máy', value: 8000000 },
      { name: 'Bình nóng lạnh Ariston 30L', category: 'Điện máy', value: 5000000 },
      { name: 'Tủ lạnh Samsung 300L', category: 'Điện máy', value: 9000000 },
      { name: 'Máy giặt Electrolux 9kg', category: 'Điện máy', value: 9000000 },
      { name: 'Giường đôi 1m8', category: 'Nội thất', value: 5000000 },
      { name: 'Giường đơn 1m2', category: 'Nội thất', value: 2500000 },
      { name: 'Sofa góc L', category: 'Nội thất', value: 6000000 },
      { name: 'Bàn ăn 4 ghế', category: 'Nội thất', value: 3000000 },
    ],
  }
  for (const room of rooms) {
    const assets = assetTemplates[room.roomType || 'Studio'] || assetTemplates['Studio']
    for (const a of assets) {
      await prisma.asset.create({
        data: { roomId: room.id, name: a.name, category: a.category, status: 'GOOD', value: a.value, purchaseDate: new Date('2025-08-01') }
      })
    }
  }

  // 5. Tạo cư dân, hợp đồng, chỉ số, hoá đơn
  console.log('📦 Tạo cư dân và hợp đồng...')
  const hashedTenant = await hashPassword('123456')
  const tenantUsers = []
  const contracts = []

  // Các tháng cần tạo: 10/2025 -> 2/2026 (Để tháng 3 dùng tính năng chốt số tạo hoá đơn)
  const months = [
    { m: 10, y: 2025 }, { m: 11, y: 2025 }, { m: 12, y: 2025 },
    { m: 1, y: 2026 }, { m: 2, y: 2026 }
  ]

  for (let i = 0; i < 19; i++) {
    const t = tenantsData[i]
    const room = rooms[rentedRoomIndices[i]]
    const duration = contractDurations[i]

    // Tạo user
    const user = await prisma.user.create({
      data: {
        phone: t.phone, password: hashedTenant, fullName: t.fullName, email: t.email,
        role: 'TENANT', isActive: true, isFirstLogin: false,
        dob: new Date(t.dob), gender: t.gender, cccdNumber: t.cccd,
        address: t.address, job: t.job, licensePlate: t.licensePlate || null,
      }
    })
    tenantUsers.push(user)

    // Tạo hợp đồng
    const startDate = new Date('2025-10-01')
    const endDate = new Date('2025-10-01')
    endDate.setMonth(endDate.getMonth() + duration)
    const roomPrice = Number(room.price)

    const contract = await prisma.contract.create({
      data: {
        userId: user.id, roomId: room.id,
        startDate, endDate,
        deposit: roomPrice * 2, rentPrice: roomPrice, status: 'ACTIVE',
      }
    })
    contracts.push(contract)

    // Tạo người ở cùng
    for (const occ of t.occupants) {
      await prisma.contractOccupant.create({
        data: {
          contractId: contract.id, fullName: occ.fullName,
          cccdNumber: occ.cccd || null, phone: occ.phone || null,
          relationship: occ.relationship, dob: occ.dob ? new Date(occ.dob) : null,
        }
      })
    }

    // Tạo chỉ số điện nước và hoá đơn cho từng tháng
    let elecCumulative = 0
    let waterCumulative = 0

    for (let mi = 0; mi < months.length; mi++) {
      const { m, y } = months[mi]
      const [elecUsage, waterUsage] = getMonthlyUsage(room.roomType || 'Studio', m)
      const elecOld = elecCumulative
      elecCumulative += elecUsage
      const waterOld = waterCumulative
      waterCumulative += waterUsage

      await prisma.meterReading.create({
        data: {
          roomId: room.id, month: m, year: y,
          elecOld, elecNew: elecCumulative,
          waterOld, waterNew: waterCumulative,
          recordedDate: new Date(y, m - 1, 28),
        }
      })

      // Hoá đơn - tính tiền
      const amountElec = elecUsage * ELEC_PRICE
      const amountWater = waterUsage * WATER_PRICE
      const numPeople = 1 + t.occupants.length
      const amountCommonService = numPeople * COMMON_SERVICE_PRICE
      const totalAmount = roomPrice + amountElec + amountWater + amountCommonService
      const dueDate = new Date(y, m - 1, 5) // Hạn thanh toán ngày 5

      // Xác định trạng thái: tất cả PAID, ngoại trừ 2 hoá đơn tháng 2 là OVERDUE
      let status: 'PAID' | 'UNPAID' | 'OVERDUE' = 'PAID'
      let paidAt: Date | null = new Date(y, m - 1, Math.min(3 + Math.floor(Math.random() * 4), 5))

      // 2 phòng đầu tiên (i = 0, i = 1) vào tháng 2/2026 sẽ bị OVERDUE
      if (y === 2026 && m === 2 && (i === 0 || i === 1)) {
        status = 'OVERDUE'
        paidAt = null
      }

      const invoice = await prisma.invoice.create({
        data: {
          contractId: contract.id, month: m, year: y,
          amountRoom: roomPrice, amountElec, amountWater,
          amountCommonService, amountService: 0,
          totalAmount, status, paymentDueDate: dueDate, paidAt,
        }
      })

      // Tạo payment cho hoá đơn đã thanh toán
      if (status === 'PAID' && paidAt) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id, amount: totalAmount,
            method: ['CASH', 'BANK_TRANSFER', 'VIETQR'][Math.floor(Math.random() * 3)] as any,
            status: 'SUCCESS', paidAt,
          }
        })
      }
    }
  }
  console.log(`✅ ${tenantUsers.length} cư dân, ${contracts.length} hợp đồng`)

  // 6. Issues (Đơn bảo trì)
  console.log('📦 Tạo đơn bảo trì...')
  for (const issue of issuesData) {
    const user = tenantUsers[issue.tenantIdx]
    const room = rooms[rentedRoomIndices[issue.tenantIdx]]
    await prisma.issue.create({
      data: {
        userId: user.id, roomId: room.id,
        title: issue.title, description: issue.desc,
        status: issue.status, repairCost: issue.cost,
        createdAt: new Date(issue.date),
      }
    })
  }
  console.log(`✅ ${issuesData.length} đơn bảo trì`)

  // 7. Bài viết cộng đồng
  console.log('📦 Tạo bài viết cộng đồng...')
  for (const post of postsData) {
    await prisma.post.create({
      data: {
        userId: tenantUsers[post.tenantIdx].id,
        content: post.content, status: post.status,
        createdAt: new Date(post.date),
      }
    })
  }
  console.log(`✅ ${postsData.length} bài viết cộng đồng`)

  // 8. Service Orders
  console.log('📦 Tạo đơn dịch vụ...')
  const serviceOrdersData = [
    { tenantIdx: 0, serviceName: 'Vệ sinh máy lạnh', qty: 1, date: '2025-12-10', status: 'DONE' as const },
    { tenantIdx: 3, serviceName: 'Giặt ủi', qty: 3, date: '2025-11-20', status: 'DONE' as const },
    { tenantIdx: 6, serviceName: 'Vệ sinh máy lạnh', qty: 1, date: '2026-01-15', status: 'DONE' as const },
    { tenantIdx: 8, serviceName: 'Giặt ủi', qty: 5, date: '2026-02-01', status: 'DONE' as const },
    { tenantIdx: 11, serviceName: 'Dọn phòng', qty: 1, date: '2026-02-20', status: 'DONE' as const },
    { tenantIdx: 14, serviceName: 'Thay bình ga', qty: 1, date: '2026-03-01', status: 'PENDING' as const },
    { tenantIdx: 17, serviceName: 'Giặt ủi', qty: 2, date: '2026-03-10', status: 'PENDING' as const },
  ]
  for (const so of serviceOrdersData) {
    const service = await prisma.service.findFirst({ where: { name: so.serviceName } })
    if (service) {
      await prisma.serviceOrder.create({
        data: {
          userId: tenantUsers[so.tenantIdx].id, serviceId: service.id,
          quantity: so.qty, total: Number(service.unitPrice) * so.qty,
          note: `Yêu cầu ${so.serviceName}`, status: so.status,
          orderDate: new Date(so.date),
        }
      })
    }
  }
  console.log(`✅ ${serviceOrdersData.length} đơn dịch vụ`)

  // 9. Tin nhắn
  console.log('📦 Tạo tin nhắn...')
  const messagesData = [
    { from: 0, content: 'Chào anh/chị, em có thắc mắc về hoá đơn tháng 11 ạ. Tiền điện hơi cao so với tháng trước?', date: '2025-12-03', read: true },
    { from: 0, reply: 'Chào bạn, tháng 11 do thời tiết nóng nên lượng điện sử dụng tăng. Bạn kiểm tra lại chỉ số nhé!', date: '2025-12-03', read: true },
    { from: 4, content: 'Em muốn đăng ký dịch vụ vệ sinh máy lạnh ạ', date: '2026-01-05', read: true },
    { from: 4, reply: 'Đã ghi nhận, thợ sẽ lên lịch trong tuần này nhé!', date: '2026-01-05', read: true },
    { from: 8, content: 'Anh/chị ơi, ổ cắm điện phòng em bị chập. Mong được hỗ trợ sớm ạ!', date: '2026-01-10', read: true },
    { from: 12, content: 'Cầu dao nhà em nhảy liên tục ạ, em không dám bật điện', date: '2026-02-15', read: true },
    { from: 12, reply: 'Thợ sẽ lên kiểm tra ngay trong hôm nay nhé bạn!', date: '2026-02-15', read: true },
    { from: 5, content: 'Bồn cầu phòng em bị nghẹt ạ, nước xả rất yếu', date: '2026-03-05', read: false },
    { from: 14, content: 'Tường phòng em bị thấm nước khi mưa to ạ, ẩm mốc rồi', date: '2026-03-10', read: false },
    { from: 17, content: 'Wifi tầng 3 chập chờn quá ạ, đứt liên tục mấy ngày nay', date: '2026-03-14', read: false },
  ]
  for (const msg of messagesData) {
    if (msg.reply) {
      // Admin trả lời
      await prisma.message.create({
        data: {
          senderId: admin.id, receiverId: tenantUsers[msg.from].id,
          content: msg.reply, isRead: msg.read, createdAt: new Date(msg.date),
        }
      })
    } else {
      // Tenant gửi
      await prisma.message.create({
        data: {
          senderId: tenantUsers[msg.from].id, receiverId: admin.id,
          content: msg.content!, isRead: msg.read, createdAt: new Date(msg.date),
        }
      })
    }
  }
  console.log(`✅ ${messagesData.length} tin nhắn`)

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('✅ HOÀN THÀNH!')
  console.log('='.repeat(50))
  console.log(`   👤 Admin: 0963304396 / admin`)
  console.log(`   🏠 20 Phòng (19 thuê, 1 trống)`)
  console.log(`   👥 19 Cư dân (+ người ở cùng)`)
  console.log(`   📄 19 Hợp đồng (bắt đầu 10/2025)`)
  console.log(`   📊 ${19 * 5} Hoá đơn (10/2025 - 2/2026)`)
  console.log(`   ⚡ ${19 * 5} Chỉ số điện nước`)
  console.log(`   🔧 ${issuesData.length} Đơn bảo trì`)
  console.log(`   📝 ${postsData.length} Bài viết cộng đồng`)
  console.log(`   🧹 ${serviceOrdersData.length} Đơn dịch vụ`)
  console.log(`   💬 ${messagesData.length} Tin nhắn`)
  console.log('   🔑 Mật khẩu tenant: 123456')
  console.log('='.repeat(50))
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
