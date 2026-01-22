import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Không tìm thấy file' },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'File Excel không có dữ liệu' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      try {
        // Extract data from Excel row
        // Expected columns: Phòng, Khách thuê, Kỳ TT, Tiền phòng, Tiền điện, Tiền nước, Dịch vụ, Dịch vụ chung
        const roomName = row['Phòng'] || row['phòng'] || row['PHÒNG']
        const tenantName = row['Khách thuê'] || row['khách thuê'] || row['KHÁCH THUÊ']
        const period = row['Kỳ TT'] || row['kỳ tt'] || row['KỲ TT']
        const amountRoom = parseFloat(row['Tiền phòng'] || row['tiền phòng'] || row['TIỀN PHÒNG'] || 0)
        const amountElec = parseFloat(row['Tiền điện'] || row['tiền điện'] || row['TIỀN ĐIỆN'] || 0)
        const amountWater = parseFloat(row['Tiền nước'] || row['tiền nước'] || row['TIỀN NƯỚC'] || 0)
        const amountService = parseFloat(row['Dịch vụ'] || row['dịch vụ'] || row['DỊCH VỤ'] || 0)
        const amountCommonService = parseFloat(row['Dịch vụ chung'] || row['dịch vụ chung'] || row['DỊCH VỤ CHUNG'] || 0)

        if (!roomName || !tenantName || !period) {
          results.failed++
          results.errors.push(`Dòng ${i + 2}: Thiếu thông tin bắt buộc (Phòng, Khách thuê, Kỳ TT)`)
          continue
        }

        // Parse period (format: MM/YYYY)
        const [month, year] = period.toString().split('/').map(Number)
        if (!month || !year || month < 1 || month > 12) {
          results.failed++
          results.errors.push(`Dòng ${i + 2}: Kỳ TT không hợp lệ (${period})`)
          continue
        }

        // Find room
        const room = await prisma.room.findUnique({
          where: { name: roomName.toString().trim() }
        })

        if (!room) {
          results.failed++
          results.errors.push(`Dòng ${i + 2}: Không tìm thấy phòng ${roomName}`)
          continue
        }

        // Find user by name
        const user = await prisma.user.findFirst({
          where: {
            fullName: {
              contains: tenantName.toString().trim(),
              mode: 'insensitive'
            }
          }
        })

        if (!user) {
          results.failed++
          results.errors.push(`Dòng ${i + 2}: Không tìm thấy khách thuê ${tenantName}`)
          continue
        }

        // Find active contract
        const contract = await prisma.contract.findFirst({
          where: {
            userId: user.id,
            roomId: room.id,
            status: 'ACTIVE'
          }
        })

        if (!contract) {
          results.failed++
          results.errors.push(`Dòng ${i + 2}: Không tìm thấy hợp đồng hoạt động cho ${tenantName} - ${roomName}`)
          continue
        }

        // Cho phép tạo nhiều hóa đơn trong cùng tháng (để bổ sung thiếu sót)
        // Không kiểm tra hóa đơn đã tồn tại

        // Calculate total
        const totalAmount = amountRoom + amountElec + amountWater + amountService + amountCommonService

        // Create invoice
        await prisma.invoice.create({
          data: {
            contractId: contract.id,
            month,
            year,
            amountRoom,
            amountElec,
            amountWater,
            amountService,
            amountCommonService,
            totalAmount,
            status: 'UNPAID'
          }
        })

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Dòng ${i + 2}: ${error.message || 'Lỗi không xác định'}`)
      }
    }

    return NextResponse.json({
      message: `Nhập dữ liệu hoàn tất: ${results.success} thành công, ${results.failed} thất bại`,
      results
    })
  } catch (error: any) {
    console.error('Error importing invoices:', error)
    return NextResponse.json(
      { error: `Lỗi khi nhập file: ${error.message}` },
      { status: 500 }
    )
  }
}
