import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geminiModel } from '@/lib/gemini'

export async function POST() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 })
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Gather data in parallel
    const [totalRooms, availableRooms, activeContracts, recentInvoices, overdueCount, expiringContracts] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: 'AVAILABLE' } }),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.findMany({
        where: { year: currentYear },
        select: { month: true, year: true, totalAmount: true, status: true },
      }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: currentDate,
            lte: new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          room: { select: { name: true } },
          user: { select: { fullName: true } },
        },
      }),
    ])

    // Monthly revenue summary
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const monthInvoices = recentInvoices.filter((inv) => inv.month === i + 1)
      return {
        month: i + 1,
        total: monthInvoices.reduce((s, inv) => s + Number(inv.totalAmount), 0),
        paid: monthInvoices.filter((inv) => inv.status === 'PAID').reduce((s, inv) => s + Number(inv.totalAmount), 0),
        count: monthInvoices.length,
      }
    }).filter((m) => m.count > 0)

    const occupancyRate = totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms * 100).toFixed(1) : '0'

    const dataContext = `
DỮ LIỆU THỐNG KÊ NHÀ TRỌ EZ-HOME (Tháng ${currentMonth}/${currentYear}):

1. PHÒNG:
- Tổng: ${totalRooms} phòng
- Trống: ${availableRooms} phòng
- Tỷ lệ lấp đầy: ${occupancyRate}%
- Hợp đồng đang hoạt động: ${activeContracts}

2. DOANH THU THEO THÁNG (${currentYear}):
${monthlyRevenue.map((m) => `- Tháng ${m.month}: Tổng ${m.total.toLocaleString('vi-VN')} VNĐ, Đã thu ${m.paid.toLocaleString('vi-VN')} VNĐ, ${m.count} hoá đơn`).join('\n')}

3. HOÁ ĐƠN QUÁ HẠN: ${overdueCount} hoá đơn

4. HỢP ĐỒNG SẮP HẾT HẠN (90 NGÀY TỚI): ${expiringContracts.length} hợp đồng
${expiringContracts.map((c) => `- ${c.room.name}: ${c.user.fullName}, hết hạn ${c.endDate?.toLocaleDateString('vi-VN')}`).join('\n')}
`

    const prompt = `Bạn là chuyên gia phân tích dữ liệu bất động sản. Hãy phân tích dữ liệu nhà trọ sau và đưa ra nhận xét + khuyến nghị.

${dataContext}

Yêu cầu:
1. Phân tích xu hướng doanh thu (tăng/giảm, ổn định?)
2. Đánh giá tỷ lệ lấp đầy
3. Cảnh báo rủi ro (hoá đơn quá hạn, HĐ sắp hết hạn)
4. Đề xuất hành động cụ thể cho admin
5. Dự đoán xu hướng ngắn hạn

Trả lời bằng tiếng Việt, ngắn gọn, dùng emoji. Format markdown.`

    const result = await geminiModel.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ insights: text })
  } catch (error: any) {
    console.error('[AI Insights] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Lỗi khi phân tích AI' },
      { status: 500 }
    )
  }
}
