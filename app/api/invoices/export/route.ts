import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (month) {
      where.month = parseInt(month)
    }
    if (year) {
      where.year = parseInt(year)
    }
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filter by search if provided
    let filteredInvoices = invoices
    if (search) {
      const searchLower = search.toLowerCase()
      filteredInvoices = invoices.filter(invoice => {
        const userName = invoice.contract.user.fullName.toLowerCase()
        const roomName = invoice.contract.room.name.toLowerCase()
        return userName.includes(searchLower) || roomName.includes(searchLower)
      })
    }

    // Prepare data for Excel
    const excelData = filteredInvoices.map((invoice) => ({
      'Mã HĐ': `INV-${invoice.id.toString().padStart(6, '0')}`,
      'Phòng': invoice.contract.room.name,
      'Khách thuê': invoice.contract.user.fullName,
      'SĐT': invoice.contract.user.phone,
      'Email': invoice.contract.user.email || '',
      'Kỳ TT': `${invoice.month}/${invoice.year}`,
      'Tiền phòng': Number(invoice.amountRoom),
      'Tiền điện': Number(invoice.amountElec),
      'Tiền nước': Number(invoice.amountWater),
      'Dịch vụ': Number(invoice.amountService),
      'Dịch vụ chung': Number(invoice.amountCommonService),
      'Tổng tiền': Number(invoice.totalAmount),
      'Trạng thái': invoice.status === 'PAID' ? 'Đã thanh toán' : invoice.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán',
      'Ngày tạo': new Date(invoice.createdAt).toLocaleDateString('vi-VN'),
      'Ngày thanh toán': invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('vi-VN') : ''
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Mã HĐ
      { wch: 10 }, // Phòng
      { wch: 25 }, // Khách thuê
      { wch: 12 }, // SĐT
      { wch: 25 }, // Email
      { wch: 10 }, // Kỳ TT
      { wch: 15 }, // Tiền phòng
      { wch: 15 }, // Tiền điện
      { wch: 15 }, // Tiền nước
      { wch: 15 }, // Dịch vụ
      { wch: 15 }, // Dịch vụ chung
      { wch: 15 }, // Tổng tiền
      { wch: 15 }, // Trạng thái
      { wch: 12 }, // Ngày tạo
      { wch: 15 }  // Ngày thanh toán
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Hóa đơn')

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Hoa-don-${month || 'all'}-${year || 'all'}.xlsx"`
      }
    })
  } catch (error) {
    console.error('Error exporting invoices:', error)
    return NextResponse.json(
      { error: 'Failed to export invoices' },
      { status: 500 }
    )
  }
}
