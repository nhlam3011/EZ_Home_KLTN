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

    const elecPrice = elecService ? Number(elecService.unitPrice) : 3500
    const waterPrice = waterService ? Number(waterService.unitPrice) : 25000
    const commonServicePrice = commonService ? Number(commonService.unitPrice) : 0
    const numberOfPeople = 1 + (invoice.contract.occupants?.length || 0)
    const elecConsumption = meterReading ? meterReading.elecNew - meterReading.elecOld : 0
    const waterConsumption = meterReading ? meterReading.waterNew - meterReading.waterOld : 0

    // Generate HTML invoice with print styles
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hóa đơn ${invoice.month}/${invoice.year}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { 
            font-family: 'Times New Roman', serif; 
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header p {
            margin: 5px 0;
            font-size: 12px;
          }
          .info { 
            margin-bottom: 20px; 
          }
          .info h3 {
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          .info p {
            margin: 3px 0;
            font-size: 12px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold;
            text-align: center;
          }
          td {
            text-align: right;
          }
          td:first-child {
            text-align: left;
          }
          .total { 
            text-align: right; 
            font-weight: bold; 
            font-size: 16px; 
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .total p {
            margin: 5px 0;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-button:hover {
            background: #0056b3;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">🖨️ In hóa đơn</button>
        
        <div class="header">
          <h1>EZ-Home Management</h1>
          <p>59 - Ngõ 192 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội</p>
          <p>Hotline: 1900 1234</p>
          <h2 style="margin-top: 15px; font-size: 20px;">HÓA ĐƠN</h2>
          <p><strong>Mã HĐ: INV-${invoice.id.toString().padStart(6, '0')}</strong></p>
          <p>Ngày lập: ${new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</p>
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
          <p><strong>Tháng ${invoice.month} / ${invoice.year}</strong></p>
          <p>Từ ngày: 01/${invoice.month}/${invoice.year}</p>
          <p>Đến ngày: ${new Date(invoice.year, invoice.month, 0).getDate()}/${invoice.month}/${invoice.year}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40%;">DỊCH VỤ</th>
              <th style="width: 20%;">ĐƠN GIÁ</th>
              <th style="width: 15%;">SỐ LƯỢNG</th>
              <th style="width: 25%;">THÀNH TIỀN</th>
            </tr>
          </thead>
          <tbody>
            ${Number(invoice.amountRoom) > 0 ? `
            <tr>
              <td>Tiền Thuê Phòng</td>
              <td>${Number(invoice.amountRoom).toLocaleString('vi-VN')} ₫</td>
              <td>1</td>
              <td>${Number(invoice.amountRoom).toLocaleString('vi-VN')} ₫</td>
            </tr>
            ` : ''}
            ${Number(invoice.amountElec) > 0 ? `
            <tr>
              <td>Tiền Điện${meterReading ? ` (Chỉ số: ${meterReading.elecOld} - ${meterReading.elecNew} kWh)` : ''}</td>
              <td>${elecPrice.toLocaleString('vi-VN')} ₫</td>
              <td>${elecConsumption.toFixed(0)}</td>
              <td>${Number(invoice.amountElec).toLocaleString('vi-VN')} ₫</td>
            </tr>
            ` : ''}
            ${Number(invoice.amountWater) > 0 ? `
            <tr>
              <td>Tiền Nước${meterReading ? ` (Chỉ số: ${meterReading.waterOld} - ${meterReading.waterNew} m³)` : ''}</td>
              <td>${waterPrice.toLocaleString('vi-VN')} ₫</td>
              <td>${waterConsumption.toFixed(2)}</td>
              <td>${Number(invoice.amountWater).toLocaleString('vi-VN')} ₫</td>
            </tr>
            ` : ''}
            ${Number(invoice.amountCommonService) > 0 ? `
            <tr>
              <td>Phí Dịch vụ chung (theo đầu người)</td>
              <td>${commonServicePrice > 0 ? commonServicePrice.toLocaleString('vi-VN') : Number(invoice.amountCommonService).toLocaleString('vi-VN')} ₫</td>
              <td>${numberOfPeople}</td>
              <td>${Number(invoice.amountCommonService).toLocaleString('vi-VN')} ₫</td>
            </tr>
            ` : ''}
            ${Number(invoice.amountService) > 0 ? `
            <tr>
              <td>Phí Dịch vụ khác</td>
              <td>${Number(invoice.amountService).toLocaleString('vi-VN')} ₫</td>
              <td>1</td>
              <td>${Number(invoice.amountService).toLocaleString('vi-VN')} ₫</td>
            </tr>
            ` : ''}
            ${Number(invoice.overdueAmount) > 0 ? `
            <tr>
              <td style="color: #c2410c; font-weight: bold;">Nợ cũ (các kỳ trước)</td>
              <td style="color: #c2410c;">${Number(invoice.overdueAmount).toLocaleString('vi-VN')} ₫</td>
              <td style="color: #c2410c;">1</td>
              <td style="color: #c2410c; font-weight: bold;">${Number(invoice.overdueAmount).toLocaleString('vi-VN')} ₫</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        
        <div class="total">
          <p>Tổng cần thanh toán: <strong>${Number(invoice.totalAmount).toLocaleString('vi-VN')} ₫</strong></p>
          <p>Trạng thái: <strong>${invoice.status === 'PAID' ? 'Đã thanh toán' : invoice.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán'}</strong></p>
          ${invoice.paidAt ? `<p>Ngày thanh toán: ${new Date(invoice.paidAt).toLocaleDateString('vi-VN')}</p>` : ''}
        </div>
        
        <div class="footer">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
          <p>Hóa đơn điện tử có giá trị pháp lý như hóa đơn giấy</p>
        </div>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="Hoa-don-${invoice.month}-${invoice.year}.html"`
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
