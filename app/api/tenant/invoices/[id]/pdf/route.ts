import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const invoiceId = parseInt(resolvedParams.id)

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: {
          include: {
            user: true,
            room: true,
            occupants: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Get meter reading
    const meterReading = await prisma.meterReading.findFirst({
      where: {
        roomId: invoice.contract.roomId,
        month: invoice.month,
        year: invoice.year
      }
    })

    // Get service prices
    const elecService = await prisma.service.findFirst({
      where: { name: 'Điện', isActive: true }
    })
    const waterService = await prisma.service.findFirst({
      where: { name: 'Nước', isActive: true }
    })
    const commonService = await prisma.service.findFirst({
      where: {
        OR: [
          { name: { contains: 'Dịch vụ chung', mode: 'insensitive' } },
          { name: { contains: 'Phí quản lý', mode: 'insensitive' } },
          { name: { contains: 'Phí dịch vụ', mode: 'insensitive' } },
          { name: { contains: 'Quản lý', mode: 'insensitive' } }
        ],
        isActive: true
      }
    })

    const elecPrice = elecService ? Number(elecService.unitPrice) : 0
    const waterPrice = waterService ? Number(waterService.unitPrice) : 0
    const commonServicePrice = commonService ? Number(commonService.unitPrice) : 0
    const numberOfPeople = 1 + (invoice.contract.occupants?.length || 0)
    const elecConsumption = meterReading ? meterReading.elecNew - meterReading.elecOld : 0
    const waterConsumption = meterReading ? meterReading.waterNew - meterReading.waterOld : 0

    // Generate simple HTML invoice (can be replaced with PDF library later)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hóa đơn ${invoice.month}/${invoice.year}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EZ-Home Management</h1>
          <p>59 - Ngõ 192 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội</p>
          <p>Hotline: 1900 1234</p>
          <h2>HÓA ĐƠN</h2>
          <p>Mã HĐ: INV-${invoice.id.toString().padStart(6, '0')}</p>
        </div>
        <div class="info">
          <h3>NGƯỜI NHẬN</h3>
          <p><strong>${invoice.contract.user.fullName}</strong></p>
          <p>Phòng ${invoice.contract.room.name} - Tầng ${invoice.contract.room.floor}</p>
          <p>SĐT: ${invoice.contract.user.phone}</p>
          <p>Email: ${invoice.contract.user.email || 'N/A'}</p>
        </div>
        <div class="info">
          <h3>KỲ THANH TOÁN</h3>
          <p>Tháng ${invoice.month} / ${invoice.year}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>DỊCH VỤ</th>
              <th>ĐƠN GIÁ</th>
              <th>SỐ LƯỢNG</th>
              <th>THÀNH TIỀN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tiền Thuê Phòng</td>
              <td>${Number(invoice.amountRoom).toLocaleString('vi-VN')} ₫</td>
              <td>1</td>
              <td>${Number(invoice.amountRoom).toLocaleString('vi-VN')} ₫</td>
            </tr>
            <tr>
              <td>Tiền Điện${meterReading ? ` (${meterReading.elecOld} - ${meterReading.elecNew} kWh)` : ''}</td>
              <td>${elecPrice.toLocaleString('vi-VN')} ₫</td>
              <td>${elecConsumption.toFixed(0)}</td>
              <td>${Number(invoice.amountElec).toLocaleString('vi-VN')} ₫</td>
            </tr>
            <tr>
              <td>Tiền Nước${meterReading ? ` (${meterReading.waterOld} - ${meterReading.waterNew} m³)` : ''}</td>
              <td>${waterPrice.toLocaleString('vi-VN')} ₫</td>
              <td>${waterConsumption.toFixed(2)}</td>
              <td>${Number(invoice.amountWater).toLocaleString('vi-VN')} ₫</td>
            </tr>
            <tr>
              <td>Phí Quản Lý & Dịch vụ (theo đầu người)</td>
              <td>${commonServicePrice.toLocaleString('vi-VN')} ₫</td>
              <td>${numberOfPeople}</td>
              <td>${Number(invoice.amountService).toLocaleString('vi-VN')} ₫</td>
            </tr>
          </tbody>
        </table>
        <div class="total">
          <p>Tổng cần thanh toán: ${Number(invoice.totalAmount).toLocaleString('vi-VN')} ₫</p>
          <p>Trạng thái: ${invoice.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
        </div>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="Hoa-don-${invoice.month}-${invoice.year}.html"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
