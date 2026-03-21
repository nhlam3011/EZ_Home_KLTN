import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { FunctionDeclaration, SchemaType } from '@google/generative-ai'

// ============================================
// FUNCTION DECLARATIONS cho Gemini
// ============================================

export const aiToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_room_list',
    description: 'Lấy danh sách phòng. Có thể lọc theo trạng thái: AVAILABLE (trống), RENTED (đang thuê), MAINTENANCE (đang sửa), hoặc lấy tất cả.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: 'Trạng thái phòng cần lọc: AVAILABLE, RENTED, MAINTENANCE. Để trống lấy tất cả.',
        },
        buildingId: {
          type: SchemaType.NUMBER,
          description: 'ID tòa nhà cụ thể. Để trống hoặc null để lấy theo tòa nhà đang ở hoặc tất cả.',
        },
      },
    },
  },
  {
    name: 'get_residents',
    description: 'Lấy danh sách cư dân/khách thuê. Có thể tìm kiếm theo tên hoặc số điện thoại.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        search: {
          type: SchemaType.STRING,
          description: 'Từ khóa tìm kiếm (tên, SĐT). Để trống lấy tất cả.',
        },
        buildingId: {
          type: SchemaType.NUMBER,
          description: 'ID tòa nhà cụ thể.',
        },
      },
    },
  },
  {
    name: 'add_resident',
    description: 'Thêm khách thuê mới. Cần: họ tên, số điện thoại, phòng (tên phòng hoặc ID), ngày bắt đầu, giá thuê. Tùy chọn: email, CCCD, ngày sinh, tiền cọc, ngày kết thúc HĐ.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        fullName: { type: SchemaType.STRING, description: 'Họ và tên' },
        phone: { type: SchemaType.STRING, description: 'Số điện thoại' },
        email: { type: SchemaType.STRING, description: 'Email (tùy chọn)' },
        cccdNumber: { type: SchemaType.STRING, description: 'Số CCCD (tùy chọn)' },
        dob: { type: SchemaType.STRING, description: 'Ngày sinh ISO format (tùy chọn)' },
        address: { type: SchemaType.STRING, description: 'Địa chỉ (tùy chọn)' },
        roomName: { type: SchemaType.STRING, description: 'Tên phòng, VD: P.101' },
        startDate: { type: SchemaType.STRING, description: 'Ngày bắt đầu hợp đồng ISO format' },
        endDate: { type: SchemaType.STRING, description: 'Ngày kết thúc hợp đồng ISO format (tùy chọn)' },
        deposit: { type: SchemaType.NUMBER, description: 'Tiền cọc (tùy chọn)' },
        rentPrice: { type: SchemaType.NUMBER, description: 'Giá thuê hàng tháng' },
        buildingId: { type: SchemaType.NUMBER, description: 'ID tòa nhà (tùy chọn)' },
      },
      required: ['fullName', 'phone', 'roomName', 'startDate', 'rentPrice'],
    },
  },
  {
    name: 'create_invoice',
    description: 'Tạo hoá đơn cho một phòng theo tháng/năm. Cần: tên phòng, tháng, năm. Hệ thống sẽ tự tính dựa trên hợp đồng hiện tại.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        roomName: { type: SchemaType.STRING, description: 'Tên phòng, VD: P.101' },
        month: { type: SchemaType.NUMBER, description: 'Tháng (1-12)' },
        year: { type: SchemaType.NUMBER, description: 'Năm (VD: 2026)' },
        buildingId: { type: SchemaType.NUMBER, description: 'ID tòa nhà (tùy chọn)' },
        amountRoom: { type: SchemaType.NUMBER, description: 'Tiền phòng (tùy chọn, nếu muốn đặt thủ công)' },
        amountElec: { type: SchemaType.NUMBER, description: 'Tiền điện (tùy chọn)' },
        amountWater: { type: SchemaType.NUMBER, description: 'Tiền nước (tùy chọn)' },
        amountService: { type: SchemaType.NUMBER, description: 'Phí dịch vụ khác (tùy chọn)' },
        totalAmount: { type: SchemaType.NUMBER, description: 'Tổng tiền (tùy chọn, nếu cung cấp sẽ bỏ qua tính toán tự động)' },
        description: { type: SchemaType.STRING, description: 'Ghi chú cho hoá đơn (tùy chọn)' },
      },
      required: ['roomName', 'month', 'year'],
    },
  },
  {
    name: 'get_revenue_report',
    description: 'Báo cáo doanh thu tổng hợp. Có thể xem theo tháng, quý, hoặc năm cụ thể.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        month: { type: SchemaType.NUMBER, description: 'Tháng cụ thể (1-12, tùy chọn)' },
        year: { type: SchemaType.NUMBER, description: 'Năm (VD: 2026)' },
        type: { type: SchemaType.STRING, description: 'Loại báo cáo: month (theo tháng), quarter (theo quý), year (cả năm). Mặc định: month' },
        buildingId: { type: SchemaType.NUMBER, description: 'ID tòa nhà (tùy chọn)' },
      },
      required: ['year'],
    },
  },
  {
    name: 'get_expiring_contracts',
    description: 'Lấy danh sách hợp đồng sắp hết hạn trong N ngày tới.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        days: { type: SchemaType.NUMBER, description: 'Số ngày tới để kiểm tra (mặc định 30)' },
        buildingId: { type: SchemaType.NUMBER, description: 'ID tòa nhà (tùy chọn)' },
      },
    },
  },
  {
    name: 'get_overdue_invoices',
    description: 'Lấy danh sách hoá đơn quá hạn chưa thanh toán.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        buildingId: { type: SchemaType.NUMBER, description: 'ID tòa nhà (tùy chọn)' },
      },
    },
  },
  {
    name: 'get_vacancy_risk',
    description: 'Phân tích rủi ro trống phòng dựa trên hợp đồng, thanh toán, và thời gian thuê.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        buildingId: { type: SchemaType.NUMBER, description: 'ID tòa nhà (tùy chọn)' },
      },
    },
  },
  {
    name: 'get_forecast_insights',
    description: 'Lấy dữ liệu dự báo doanh thu và rủi ro lấp đầy phòng trong 6 tháng tới. Dùng để tư vấn chiến lược kinh doanh.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_maintenance_issues',
    description: 'Lấy danh sách yêu cầu bảo trì/sự cố. Có thể lọc theo trạng thái.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: { type: SchemaType.STRING, description: 'Trạng thái: PENDING, PROCESSING, DONE, CANCELLED' },
        buildingId: { type: SchemaType.NUMBER, description: 'ID tòa nhà (tùy chọn)' },
      },
    },
  },
  {
    name: 'get_dashboard_summary',
    description: 'Lấy tổng quan dashboard: tổng phòng, phòng trống, tổng cư dân, doanh thu tháng này, các chỉ số quan trọng.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_building_list',
    description: 'Lấy danh sách tất cả các tòa nhà đang quản lý.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
]

// ============================================
// EXECUTE TOOLS - Thực thi function calls
// ============================================

export async function executeTool(name: string, args: any, contextBuildingId?: number): Promise<any> {
  const buildingId = args.buildingId || contextBuildingId

  switch (name) {
    case 'get_room_list':
      return await getRoomList({ ...args, buildingId })
    case 'get_residents':
      return await getResidents({ ...args, buildingId })
    case 'add_resident':
      return await addResident({ ...args, buildingId })
    case 'create_invoice':
      return await createInvoice({ ...args, buildingId })
    case 'get_revenue_report':
      return await getRevenueReport({ ...args, buildingId })
    case 'get_expiring_contracts':
      return await getExpiringContracts({ ...args, buildingId })
    case 'get_overdue_invoices':
      return await getOverdueInvoices(buildingId)
    case 'get_vacancy_risk':
      return await getVacancyRisk(buildingId)
    case 'get_forecast_insights':
      return await getForecastInsights(buildingId)
    case 'get_maintenance_issues':
      return await getMaintenanceIssues({ ...args, buildingId })
    case 'get_dashboard_summary':
      return await getDashboardSummary(buildingId)
    case 'get_building_list':
      return await getBuildingList()
    default:
      return { error: `Tool "${name}" không tồn tại` }
  }
}

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

async function getBuildingList() {
  const buildings = await prisma.building.findMany({
    orderBy: { name: 'asc' },
  })
  return {
    total: buildings.length,
    buildings: buildings.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      type: b.buildingType,
      totalRooms: b.totalRooms,
      status: b.status,
    })),
  }
}

async function getRoomList(args: { status?: string; buildingId?: number }) {
  const where: any = {}
  if (args.status) {
    where.status = args.status
  }
  if (args.buildingId) {
    where.buildingId = args.buildingId
  }
  const rooms = await prisma.room.findMany({
    where,
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        include: { user: { select: { fullName: true, phone: true } } },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  })

  return {
    total: rooms.length,
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      floor: r.floor,
      price: Number(r.price),
      area: r.area,
      status: r.status,
      roomType: r.roomType,
      tenant: r.contracts[0]?.user?.fullName || null,
      tenantPhone: r.contracts[0]?.user?.phone || null,
    })),
  }
}

async function getResidents(args: { search?: string; buildingId?: number }) {
  const where: any = { role: 'TENANT' }
  if (args.search) {
    where.OR = [
      { fullName: { contains: args.search, mode: 'insensitive' } },
      { phone: { contains: args.search, mode: 'insensitive' } },
    ]
  }
  if (args.buildingId) {
    where.contracts = {
      some: {
        room: {
          buildingId: args.buildingId
        },
        status: 'ACTIVE'
      }
    }
  }
  const users = await prisma.user.findMany({
    where,
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        include: { room: true },
        take: 1,
        orderBy: { startDate: 'desc' },
      },
    },
    orderBy: { fullName: 'asc' },
    take: 20,
  })

  return {
    total: users.length,
    residents: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      room: u.contracts[0]?.room?.name || 'Chưa có phòng',
      rentPrice: u.contracts[0] ? Number(u.contracts[0].rentPrice) : null,
      contractStatus: u.contracts[0]?.status || 'Không có HĐ',
      contractEnd: u.contracts[0]?.endDate || null,
    })),
  }
}

async function addResident(args: {
  fullName: string
  phone: string
  email?: string
  cccdNumber?: string
  dob?: string
  address?: string
  roomName: string
  startDate: string
  endDate?: string
  deposit?: number
  rentPrice: number
}) {
  // Find room by name
  const room = await prisma.room.findFirst({ where: { name: args.roomName } })
  if (!room) return { error: `Không tìm thấy phòng "${args.roomName}"` }
  if (room.status !== 'AVAILABLE') return { error: `Phòng "${args.roomName}" không trống (trạng thái: ${room.status})` }

  // Check phone unique
  const existing = await prisma.user.findUnique({ where: { phone: args.phone } })
  if (existing) return { error: `Số điện thoại "${args.phone}" đã tồn tại` }

  // Check CCCD unique
  if (args.cccdNumber) {
    const existingCCCD = await prisma.user.findFirst({ where: { cccdNumber: args.cccdNumber } })
    if (existingCCCD) return { error: `CCCD "${args.cccdNumber}" đã tồn tại` }
  }

  const hashedPassword = await hashPassword(args.cccdNumber || args.phone)

  const user = await prisma.user.create({
    data: {
      phone: args.phone,
      password: hashedPassword,
      fullName: args.fullName,
      email: args.email || null,
      cccdNumber: args.cccdNumber || null,
      dob: args.dob ? new Date(args.dob) : null,
      address: args.address || null,
      role: 'TENANT',
      isFirstLogin: true,
    },
  })

  const contract = await prisma.contract.create({
    data: {
      userId: user.id,
      roomId: room.id,
      startDate: new Date(args.startDate),
      endDate: args.endDate ? new Date(args.endDate) : null,
      deposit: args.deposit || 0,
      rentPrice: args.rentPrice,
      status: 'ACTIVE',
    },
  })

  await prisma.room.update({
    where: { id: room.id },
    data: { status: 'RENTED' },
  })

  return {
    success: true,
    message: `Đã thêm khách thuê "${args.fullName}" vào phòng "${args.roomName}" thành công`,
    userId: user.id,
    contractId: contract.id,
    initialPassword: args.cccdNumber || args.phone,
  }
}

async function createInvoice(args: {
  roomName: string
  month: number
  year: number
  buildingId?: number
  amountRoom?: number
  amountElec?: number
  amountWater?: number
  amountService?: number
  totalAmount?: number
  description?: string
}) {
  const whereRoom: any = { name: args.roomName }
  if (args.buildingId) {
    whereRoom.buildingId = args.buildingId
  }
  const room = await prisma.room.findFirst({ where: whereRoom })
  if (!room) return { error: `Không tìm thấy phòng "${args.roomName}"` }

  const contract = await prisma.contract.findFirst({
    where: { roomId: room.id, status: 'ACTIVE' },
    include: { user: { select: { fullName: true } } },
  })
  if (!contract) return { error: `Phòng "${args.roomName}" không có hợp đồng đang hoạt động` }

  // Check duplicate
  const existingInvoice = await prisma.invoice.findFirst({
    where: { contractId: contract.id, month: args.month, year: args.year },
  })
  if (existingInvoice) return { error: `Hoá đơn tháng ${args.month}/${args.year} cho phòng "${args.roomName}" đã tồn tại (ID: ${existingInvoice.id})` }

  // Calculation logic
  let amountRoom = args.amountRoom !== undefined ? args.amountRoom : Number(contract.rentPrice)
  let amountElec = args.amountElec || 0
  let amountWater = args.amountWater || 0
  let amountService = args.amountService || 0

  // If manual amounts not provided for elec/water, try to calculate from meter
  if (args.amountElec === undefined || args.amountWater === undefined) {
    const meter = await prisma.meterReading.findFirst({
      where: { roomId: room.id, month: args.month, year: args.year },
    })
    const settings = await prisma.settings.findMany({
      where: { key: { in: ['elecPrice', 'waterPrice'] } },
    })
    const elecPrice = Number(settings.find((s) => s.key === 'elecPrice')?.value || 3500)
    const waterPrice = Number(settings.find((s) => s.key === 'waterPrice')?.value || 30000)

    if (meter) {
      if (args.amountElec === undefined) amountElec = (meter.elecNew - meter.elecOld) * elecPrice
      if (args.amountWater === undefined) amountWater = (meter.waterNew - meter.waterOld) * waterPrice
    }
  }

  const totalAmount = args.totalAmount !== undefined ? args.totalAmount : (amountRoom + amountElec + amountWater + amountService)
  const paymentDueDate = new Date(args.year, args.month - 1, 15)

  const invoice = await prisma.invoice.create({
    data: {
      contractId: contract.id,
      month: args.month,
      year: args.year,
      amountRoom,
      amountElec,
      amountWater,
      amountService,
      totalAmount,
      status: 'UNPAID',
      paymentDueDate,
    },
  })

  return {
    success: true,
    message: `Đã tạo hoá đơn tháng ${args.month}/${args.year} cho phòng "${args.roomName}"`,
    invoiceId: invoice.id,
    tenant: contract.user.fullName,
    details: {
      tiềnPhòng: amountRoom,
      tiềnĐiện: amountElec,
      tiềnNước: amountWater,
      phíDịchVụ: amountService,
      tổngCộng: totalAmount,
    },
  }
}

async function getRevenueReport(args: { month?: number; year: number; type?: string; buildingId?: number }) {
  const reportType = args.type || 'month'
  const where: any = { year: args.year }
  if (args.month && reportType === 'month') where.month = args.month
  if (args.buildingId) {
    where.contract = {
      room: {
        buildingId: args.buildingId
      }
    }
  }

  if (reportType === 'month' && args.month) {
    const invoices = await prisma.invoice.findMany({
      where,
      include: { contract: { include: { room: true, user: { select: { fullName: true } } } } },
    })
    const paid = invoices.filter((i) => i.status === 'PAID')
    const unpaid = invoices.filter((i) => i.status === 'UNPAID')
    const overdue = invoices.filter((i) => i.status === 'OVERDUE')

    return {
      period: `Tháng ${args.month}/${args.year}`,
      tổngHoáĐơn: invoices.length,
      đãThanhToán: paid.length,
      chưaThanhToán: unpaid.length,
      quáHạn: overdue.length,
      doanhThuĐãThu: paid.reduce((s, i) => s + Number(i.totalAmount), 0),
      doanhThuChờThu: unpaid.reduce((s, i) => s + Number(i.totalAmount), 0),
      doanhThuQuáHạn: overdue.reduce((s, i) => s + Number(i.totalAmount), 0),
      tổngDoanhThu: invoices.reduce((s, i) => s + Number(i.totalAmount), 0),
    }
  }

  // Year report
  const invoices = await prisma.invoice.findMany({
    where: { year: args.year },
  })
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthInvoices = invoices.filter((inv) => inv.month === i + 1)
    return {
      tháng: i + 1,
      tổngDoanhThu: monthInvoices.reduce((s, inv) => s + Number(inv.totalAmount), 0),
      đãThu: monthInvoices.filter((inv) => inv.status === 'PAID').reduce((s, inv) => s + Number(inv.totalAmount), 0),
      sốHoáĐơn: monthInvoices.length,
    }
  })

  return {
    period: `Năm ${args.year}`,
    tổngDoanhThuCảNăm: invoices.reduce((s, i) => s + Number(i.totalAmount), 0),
    đãThuCảNăm: invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount), 0),
    chiTiếtTheoTháng: monthlyData.filter((m) => m.sốHoáĐơn > 0),
  }
}

async function getExpiringContracts(args: { days?: number; buildingId?: number }) {
  const daysAhead = args.days || 30
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const where: any = {
    status: 'ACTIVE',
    endDate: { gte: now, lte: futureDate },
  }
  if (args.buildingId) {
    where.room = {
      buildingId: args.buildingId
    }
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      user: { select: { fullName: true, phone: true } },
      room: { select: { name: true, floor: true } },
    },
    orderBy: { endDate: 'asc' },
  })

  return {
    total: contracts.length,
    daysChecked: daysAhead,
    contracts: contracts.map((c) => ({
      contractId: c.id,
      tenant: c.user.fullName,
      phone: c.user.phone,
      room: c.room.name,
      floor: c.room.floor,
      endDate: c.endDate,
      daysRemaining: Math.ceil(((c.endDate?.getTime() || 0) - now.getTime()) / (1000 * 60 * 60 * 24)),
      rentPrice: Number(c.rentPrice),
    })),
  }
}

async function getOverdueInvoices(buildingId?: number) {
  const where: any = { status: 'OVERDUE' }
  if (buildingId) {
    where.contract = {
      room: {
        buildingId: buildingId
      }
    }
  }
  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      contract: {
        include: {
          user: { select: { fullName: true, phone: true } },
          room: { select: { name: true } },
        },
      },
    },
    orderBy: { paymentDueDate: 'asc' },
  })

  return {
    total: invoices.length,
    tổngNợ: invoices.reduce((s, i) => s + Number(i.totalAmount), 0),
    invoices: invoices.map((i) => ({
      invoiceId: i.id,
      tenant: i.contract.user.fullName,
      phone: i.contract.user.phone,
      room: i.contract.room.name,
      period: `${i.month}/${i.year}`,
      amount: Number(i.totalAmount),
      dueDate: i.paymentDueDate,
      daysOverdue: Math.ceil((Date.now() - i.paymentDueDate.getTime()) / (1000 * 60 * 60 * 24)),
    })),
  }
}

async function getVacancyRisk(buildingId?: number) {
  const whereContract: any = { status: 'ACTIVE' }
  if (buildingId) {
    whereContract.room = { buildingId }
  }
  const activeContracts = await prisma.contract.findMany({
    where: whereContract,
    include: {
      room: true,
      user: { select: { fullName: true, phone: true } },
    },
  })

  const overdueCounts = await prisma.invoice.groupBy({
    by: ['contractId'],
    where: { contractId: { in: activeContracts.map((c) => c.id) }, status: 'OVERDUE' },
    _count: { id: true },
  })
  const overdueMap = new Map(overdueCounts.map((o) => [o.contractId, o._count.id]))

  const risks = []
  const now = new Date()

  for (const contract of activeContracts) {
    if (!contract.endDate) continue
    const daysUntilExpiry = Math.ceil((contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const overdueInvoices = overdueMap.get(contract.id) || 0

    let riskScore = 0
    if (daysUntilExpiry <= 30) riskScore += 50
    else if (daysUntilExpiry <= 60) riskScore += 30
    else if (daysUntilExpiry <= 90) riskScore += 15
    if (overdueInvoices > 0) riskScore += Math.min(30, overdueInvoices * 10)

    const riskLevel = riskScore >= 50 ? 'CAO' : riskScore >= 25 ? 'TRUNG BÌNH' : 'THẤP'

    if (riskScore > 0 || daysUntilExpiry <= 90) {
      risks.push({
        room: contract.room.name,
        tenant: contract.user.fullName,
        daysUntilExpiry,
        overdueInvoices,
        riskScore,
        riskLevel,
        monthlyRent: Number(contract.rentPrice),
      })
    }
  }

  risks.sort((a, b) => b.riskScore - a.riskScore)

  return {
    totalAtRisk: risks.length,
    highRisk: risks.filter((r) => r.riskLevel === 'CAO').length,
    risks: risks.slice(0, 10),
  }
}

async function getMaintenanceIssues(args: { status?: string; buildingId?: number }) {
  const where: any = {}
  if (args.status) where.status = args.status
  if (args.buildingId) {
    where.room = { buildingId: args.buildingId }
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      user: { select: { fullName: true, phone: true } },
      room: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  })

  return {
    total: issues.length,
    issues: issues.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description.substring(0, 100),
      room: i.room.name,
      reporter: i.user.fullName,
      status: i.status,
      repairCost: i.repairCost ? Number(i.repairCost) : null,
      createdAt: i.createdAt,
    })),
  }
}

async function getDashboardSummary(buildingId?: number) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const whereRoom: any = {}
  const whereContract: any = { status: 'ACTIVE' }
  const whereInvoice: any = { month: currentMonth, year: currentYear }
  const whereIssue: any = { status: 'PENDING' }

  if (buildingId) {
    whereRoom.buildingId = buildingId
    whereContract.room = { buildingId }
    whereInvoice.contract = { room: { buildingId } }
    whereIssue.room = { buildingId }
  }

  const [totalRooms, availableRooms, totalTenants, activeContractsCount, monthInvoices, overdueInvoices, pendingIssues] = await Promise.all([
    prisma.room.count({ where: whereRoom }),
    prisma.room.count({ where: { ...whereRoom, status: 'AVAILABLE' } }),
    prisma.user.count({ where: { role: 'TENANT', isActive: true, contracts: buildingId ? { some: { room: { buildingId }, status: 'ACTIVE' } } : undefined } }),
    prisma.contract.count({ where: whereContract }),
    prisma.invoice.findMany({ where: whereInvoice }),
    prisma.invoice.count({ where: { ...whereInvoice, status: 'OVERDUE', month: undefined, year: undefined } }), // Simplify overdue check
    prisma.issue.count({ where: whereIssue }),
  ])

  const occupancyRate = totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms * 100).toFixed(1) : '0'

  return {
    tổngPhòng: totalRooms,
    phòngTrống: availableRooms,
    tỷLệLấp: `${occupancyRate}%`,
    tổngCưDân: totalTenants,
    hợpĐồngĐangHoạtĐộng: activeContractsCount,
    doanhThuThángNày: monthInvoices.reduce((s, i) => s + Number(i.totalAmount), 0),
    đãThuThángNày: monthInvoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount), 0),
    hoáĐơnQuáHạn: overdueInvoices,
    sựCốĐangChờ: pendingIssues,
  }
}

// ============================================
// TENANT-SPECIFIC TOOLS - Chỉ truy cập dữ liệu của tenant đang đăng nhập
// ============================================

export const tenantToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'tenant_get_my_invoices',
    description: 'Lấy danh sách hoá đơn của khách thuê đang đăng nhập. Có thể lọc theo trạng thái: UNPAID, PAID, OVERDUE.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: { type: SchemaType.STRING, description: 'Trạng thái: UNPAID, PAID, OVERDUE. Để trống lấy tất cả.' },
      },
    },
  },
  {
    name: 'tenant_get_my_contract',
    description: 'Lấy thông tin hợp đồng thuê hiện tại của khách thuê đang đăng nhập.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'tenant_get_my_room',
    description: 'Lấy thông tin phòng đang thuê của khách thuê đang đăng nhập.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'tenant_get_my_issues',
    description: 'Lấy danh sách sự cố bảo trì do khách thuê đang đăng nhập đã báo.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: { type: SchemaType.STRING, description: 'Trạng thái: PENDING, PROCESSING, DONE' },
      },
    },
  },
  {
    name: 'tenant_get_my_info',
    description: 'Lấy thông tin cá nhân của khách thuê đang đăng nhập (tên, SĐT, email, phòng, hợp đồng).',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'tenant_request_renewal',
    description: 'Gửi yêu cầu gia hạn hợp đồng thuê cho admin duyệt. Cần: số tháng muốn gia hạn thêm (mặc định 6 tháng).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        months: { type: SchemaType.NUMBER, description: 'Số tháng muốn gia hạn thêm (mặc định 6)' },
      },
    },
  },
  {
    name: 'tenant_get_payment_info',
    description: 'Lấy thông tin thanh toán hoá đơn chưa thanh toán, bao gồm link trang thanh toán. Dùng khi tenant muốn thanh toán hoá đơn.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        invoiceId: { type: SchemaType.NUMBER, description: 'ID hoá đơn cụ thể cần thanh toán (tùy chọn, mặc đ ịnh lấy tất cả chưa thanh toán)' },
      },
    },
  },
]

export async function executeTenantTool(name: string, args: any, userId: number): Promise<any> {
  if (!userId) return { error: 'Không xác định được tài khoản. Vui lòng đăng nhập lại.' }

  switch (name) {
    case 'tenant_get_my_invoices':
      return await tenantGetMyInvoices(userId, args)
    case 'tenant_get_my_contract':
      return await tenantGetMyContract(userId)
    case 'tenant_get_my_room':
      return await tenantGetMyRoom(userId)
    case 'tenant_get_my_issues':
      return await tenantGetMyIssues(userId, args)
    case 'tenant_get_my_info':
      return await tenantGetMyInfo(userId)
    case 'tenant_request_renewal':
      return await tenantRequestRenewal(userId, args)
    case 'tenant_get_payment_info':
      return await tenantGetPaymentInfo(userId, args)
    default:
      return { error: `Tool "${name}" không khả dụng cho khách thuê` }
  }
}

async function tenantGetMyInvoices(userId: number, args: { status?: string }) {
  const contracts = await prisma.contract.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { id: true },
  })
  if (contracts.length === 0) return { message: 'Bạn chưa có hợp đồng nào đang hoạt động.' }

  const where: any = { contractId: { in: contracts.map(c => c.id) } }
  if (args.status) where.status = args.status

  const invoices = await prisma.invoice.findMany({
    where,
    include: { contract: { include: { room: { select: { name: true } } } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 12,
  })

  return {
    total: invoices.length,
    invoices: invoices.map(i => ({
      id: i.id,
      phòng: i.contract.room.name,
      kỳ: `${i.month}/${i.year}`,
      tiềnPhòng: Number(i.amountRoom),
      tiềnĐiện: Number(i.amountElec),
      tiềnNước: Number(i.amountWater),
      tổngCộng: Number(i.totalAmount),
      trạngThái: i.status === 'PAID' ? 'Đã thanh toán' : i.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán',
      hạnThanhToán: i.paymentDueDate,
    })),
  }
}

async function tenantGetMyContract(userId: number) {
  const contract = await prisma.contract.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { room: { select: { name: true, floor: true, area: true, price: true } } },
    orderBy: { startDate: 'desc' },
  })

  if (!contract) return { message: 'Bạn chưa có hợp đồng nào đang hoạt động.' }

  const now = new Date()
  const daysRemaining = contract.endDate
    ? Math.ceil((contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return {
    mãHĐ: contract.id,
    phòng: contract.room.name,
    tầng: contract.room.floor,
    diệnTích: contract.room.area,
    giáThuê: Number(contract.rentPrice),
    tiềnCọc: Number(contract.deposit),
    ngàyBắtĐầu: contract.startDate,
    ngàyKếtThúc: contract.endDate,
    sốNgàyCònLại: daysRemaining,
    trạngThái: contract.status,
  }
}

async function tenantGetMyRoom(userId: number) {
  const contract = await prisma.contract.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: {
      room: {
        include: {
          _count: { select: { contracts: { where: { status: 'ACTIVE' } } } },
        },
      },
    },
  })

  if (!contract) return { message: 'Bạn chưa thuê phòng nào.' }

  const room = contract.room
  return {
    tênPhòng: room.name,
    tầng: room.floor,
    diệnTích: room.area,
    loạiPhòng: room.roomType,
    giáHiệnTại: Number(room.price),
    trạngThái: room.status,
  }
}

async function tenantGetMyIssues(userId: number, args: { status?: string }) {
  const where: any = { userId }
  if (args.status) where.status = args.status

  const issues = await prisma.issue.findMany({
    where,
    include: { room: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return {
    total: issues.length,
    sựCố: issues.map(i => ({
      id: i.id,
      tiêuĐề: i.title,
      môTả: i.description.substring(0, 150),
      phòng: i.room.name,
      trạngThái: i.status === 'PENDING' ? 'Đang chờ' : i.status === 'PROCESSING' ? 'Đang xử lý' : i.status === 'DONE' ? 'Đã xong' : i.status,
      ngàyBáo: i.createdAt,
      chiPhí: i.repairCost ? Number(i.repairCost) : null,
    })),
  }
}

async function tenantGetMyInfo(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        include: { room: { select: { name: true, floor: true } } },
        take: 1,
      },
    },
  })

  if (!user) return { error: 'Không tìm thấy thông tin người dùng.' }

  return {
    họTên: user.fullName,
    sốĐiệnThoại: user.phone,
    email: user.email || 'Chưa cập nhật',
    cccd: user.cccdNumber || 'Chưa cập nhật',
    phòngĐangThuê: user.contracts[0]?.room?.name || 'Chưa thuê phòng',
    tầng: user.contracts[0]?.room?.floor || null,
  }
}

async function tenantRequestRenewal(userId: number, args: { months?: number }) {
  const months = args.months || 6

  // Find active contract
  const contract = await prisma.contract.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { room: { select: { name: true } } },
    orderBy: { startDate: 'desc' },
  })

  if (!contract) return { error: 'Bạn chưa có hợp đồng đang hoạt động để gia hạn.' }
  if (!contract.endDate) return { error: 'Hợp đồng không có ngày kết thúc, không cần gia hạn.' }

  // Check existing pending request
  try {
    const existing = await prisma.contractRenewalRequest.findFirst({
      where: { contractId: contract.id, status: 'PENDING' },
    })
    if (existing) {
      return {
        message: `Bạn đã có yêu cầu gia hạn đang chờ duyệt (ID: ${existing.id}). Vui lòng chờ admin xử lý.`,
        trạngThái: 'Đang chờ duyệt',
        ngàyGửi: existing.createdAt,
      }
    }
  } catch { }

  // Calculate new end date
  const newEndDate = new Date(contract.endDate)
  newEndDate.setMonth(newEndDate.getMonth() + months)

  try {
    const renewal = await prisma.contractRenewalRequest.create({
      data: {
        contractId: contract.id,
        userId,
        newEndDate,
        status: 'PENDING',
      },
    })

    return {
      success: true,
      message: `✅ Đã gửi yêu cầu gia hạn hợp đồng phòng ${contract.room.name} thêm ${months} tháng!`,
      chiTiết: {
        mãYêuCầu: renewal.id,
        phòng: contract.room.name,
        ngàyHếtHạnHiệnTại: contract.endDate,
        ngàyHếtHạnMới: newEndDate,
        sốThángGiaHạn: months,
        trạngThái: 'Đang chờ admin duyệt',
      },
    }
  } catch (err: any) {
    return { error: 'Không thể tạo yêu cầu gia hạn. Vui lòng thử lại sau.' }
  }
}

async function tenantGetPaymentInfo(userId: number, args: { invoiceId?: number }) {
  const contracts = await prisma.contract.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { id: true },
  })
  if (contracts.length === 0) return { message: 'Bạn chưa có hợp đồng nào đang hoạt động.' }

  const where: any = {
    contractId: { in: contracts.map(c => c.id) },
    status: { in: ['UNPAID', 'OVERDUE'] },
  }
  if (args.invoiceId) where.id = args.invoiceId

  const invoices = await prisma.invoice.findMany({
    where,
    include: { contract: { include: { room: { select: { name: true } } } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  if (invoices.length === 0) {
    return { message: '🎉 Tuyệt vời! Bạn không có hoá đơn nào cần thanh toán.' }
  }

  return {
    tổngCầnThanhToán: invoices.reduce((s, i) => s + Number(i.totalAmount), 0),
    sốHoáĐơn: invoices.length,
    hướngDẫn: 'Bạn có thể thanh toán trực tiếp tại trang Hoá đơn. Bấm vào link bên dưới để đến trang thanh toán.',
    linkThanhToán: '/tenant/invoices',
    hoáĐơn: invoices.map(i => ({
      id: i.id,
      phòng: i.contract.room.name,
      kỳ: `${i.month}/${i.year}`,
      tổngCộng: Number(i.totalAmount),
      trạngThái: i.status === 'OVERDUE' ? '⚠️ Quá hạn' : 'Chưa thanh toán',
      hạnThanhToán: i.paymentDueDate,
      linkThanhToán: `/tenant/invoices`,
    })),
  }
}

async function getForecastInsights(buildingId?: number) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Lấy lịch sử doanh thu 12 tháng
  const historyMonths = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1)
    historyMonths.push({ month: date.getMonth() + 1, year: date.getFullYear() })
  }

  const whereInvoiceMatch: any = {
    status: 'PAID',
    OR: historyMonths.map(h => ({ month: h.month, year: h.year }))
  }
  const whereContractMatch: any = { status: 'ACTIVE' }
  const whereRoomMatch: any = {}

  if (buildingId) {
    whereInvoiceMatch.contract = { room: { buildingId } }
    whereContractMatch.room = { buildingId }
    whereRoomMatch.buildingId = buildingId
  }

  const [historyResults, activeContracts, totalRooms] = await Promise.all([
    prisma.invoice.groupBy({
      by: ['month', 'year'],
      where: whereInvoiceMatch,
      _sum: { totalAmount: true }
    }),
    prisma.contract.findMany({
      where: whereContractMatch,
      include: {
        room: { select: { name: true } },
        user: { select: { fullName: true } }
      }
    }),
    prisma.room.count({ where: whereRoomMatch })
  ])

  // Linear Regression dự báo doanh thu
  const revenueData = historyMonths.map(h => {
    const match = historyResults.find(r => r.month === h.month && r.year === h.year)
    return Number(match?._sum?.totalAmount || 0)
  })

  const n = revenueData.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  revenueData.forEach((y, i) => {
    const x = i + 1
    sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x
  })
  const denom = n * sumX2 - sumX * sumX
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0
  const intercept = denom !== 0 ? (sumY - slope * sumX) / n : sumY / n
  const avgRevenue = sumY / n

  // Dự báo 3 tháng tới
  const forecast = []
  for (let i = 1; i <= 3; i++) {
    const date = new Date(currentYear, currentMonth - 1 + i, 1)
    const predicted = Math.max(0, slope * (n + i) + intercept)
    forecast.push({
      kỳ: `${date.getMonth() + 1}/${date.getFullYear()}`,
      doanhThuDựBáo: Math.round(predicted),
    })
  }

  // Rủi ro trống phòng
  const now = new Date()
  const overdueInvoicesWhere: any = {
    contractId: { in: activeContracts.map(c => c.id) },
    status: 'OVERDUE'
  }

  const overdueCounts = await prisma.invoice.groupBy({
    by: ['contractId'],
    where: overdueInvoicesWhere,
    _count: { id: true }
  })
  const overdueMap = new Map(overdueCounts.map(o => [o.contractId, o._count.id]))

  let highRisk = 0, mediumRisk = 0
  const riskDetails: any[] = []

  for (const contract of activeContracts) {
    if (!contract.endDate) continue
    const daysLeft = Math.ceil((contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const overdueInv = overdueMap.get(contract.id) || 0

    let score = 0
    if (daysLeft <= 30) score += 50
    else if (daysLeft <= 60) score += 30
    else if (daysLeft <= 90) score += 15
    if (overdueInv > 0) score += Math.min(30, overdueInv * 10)

    const level = score >= 50 ? 'CAO' : score >= 25 ? 'TRUNG BÌNH' : 'THẤP'
    if (level === 'CAO') highRisk++
    if (level === 'TRUNG BÌNH') mediumRisk++

    if (score > 0 || daysLeft <= 90) {
      riskDetails.push({
        phòng: contract.room.name,
        khách: contract.user.fullName,
        ngàyCònLại: daysLeft,
        nợQuáHạn: overdueInv,
        mứcRủiRo: level,
        giáThuê: Number(contract.rentPrice),
      })
    }
  }

  riskDetails.sort((a: any, b: any) => (b.mứcRủiRo === 'CAO' ? 1 : 0) - (a.mứcRủiRo === 'CAO' ? 1 : 0))
  const growthTrend = avgRevenue > 0 ? ((slope / avgRevenue) * 100).toFixed(1) : '0'

  return {
    dựBáoDoanhThu: {
      trungBìnhTháng: Math.round(avgRevenue),
      xuTrend: Number(growthTrend) > 0 ? `📈 Tăng ${growthTrend}%/tháng` : Number(growthTrend) < 0 ? `📉 Giảm ${Math.abs(Number(growthTrend))}%/tháng` : '➡️ Ổn định',
      dựBáo3ThángTới: forecast,
    },
    rủiRoTrốngPhòng: {
      tổngPhòng: totalRooms,
      đangCho: activeContracts.length,
      rủiRoCao: highRisk,
      rủiRoTrungBình: mediumRisk,
      chiTiết: riskDetails.slice(0, 8),
    },
    khuyếnNghị: [
      highRisk > 0 ? `⚠️ Có ${highRisk} phòng rủi ro cao cần liên hệ gia hạn ngay` : null,
      mediumRisk > 0 ? `📋 ${mediumRisk} phòng cần theo dõi trong 60 ngày tới` : null,
      Number(growthTrend) < 0 ? '💡 Doanh thu đang giảm, cần xem xét chiến lược giá thuê' : null,
      totalRooms - activeContracts.length > 0 ? `🏠 Còn ${totalRooms - activeContracts.length} phòng trống cần tìm khách` : null,
    ].filter(Boolean),
  }
}
