import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Lưu nhiều chỉ số điện nước cùng lúc
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { readings, month, year } = body // readings: [{roomId, elecNew, waterNew}]

    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập dữ liệu chỉ số' },
        { status: 400 }
      )
    }

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Vui lòng chọn kỳ chốt số' },
        { status: 400 }
      )
    }

    // Get last month's readings
    let lastMonth = parseInt(month) - 1
    let lastYear = parseInt(year)
    if (lastMonth === 0) {
      lastMonth = 12
      lastYear -= 1
    }

    const lastReadings = await prisma.meterReading.findMany({
      where: {
        month: lastMonth,
        year: lastYear
      }
    })

    const lastReadingsMap = new Map(
      lastReadings.map(r => [r.roomId, r])
    )

    // Get electricity, water, and common service prices from Service table
    const elecService = await prisma.service.findFirst({
      where: { name: 'Điện', isActive: true }
    })
    const waterService = await prisma.service.findFirst({
      where: { name: 'Nước', isActive: true }
    })
    // Tìm dịch vụ chung (có thể tên là "Dịch vụ chung", "Phí quản lý", "Phí dịch vụ", etc.)
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

    // Validate required services
    if (!elecService) {
      return NextResponse.json(
        { error: 'Không tìm thấy dịch vụ Điện trong hệ thống. Vui lòng tạo dịch vụ Điện trước khi chốt số.' },
        { status: 400 }
      )
    }

    if (!waterService) {
      return NextResponse.json(
        { error: 'Không tìm thấy dịch vụ Nước trong hệ thống. Vui lòng tạo dịch vụ Nước trước khi chốt số.' },
        { status: 400 }
      )
    }

    const elecPrice = Number(elecService.unitPrice)
    const waterPrice = Number(waterService.unitPrice)
    const commonServicePrice = commonService ? Number(commonService.unitPrice) : 0

    const results = []
    const errors = []
    const invoicesCreated = []

    for (const reading of readings) {
      const { roomId, elecNew, waterNew } = reading

      if (elecNew === undefined || elecNew === null || waterNew === undefined || waterNew === null) {
        continue // Skip empty readings
      }

      try {
        const lastReading = lastReadingsMap.get(roomId)
        const elecOld = lastReading ? lastReading.elecNew : 0
        const waterOld = lastReading ? lastReading.waterNew : 0

        // Validate - số mới phải >= số cũ
        if (elecNew < elecOld) {
          errors.push({
            roomId,
            error: `Chỉ số điện mới (${elecNew}) không được nhỏ hơn chỉ số cũ (${elecOld})`
          })
          continue
        }

        if (waterNew < waterOld) {
          errors.push({
            roomId,
            error: `Chỉ số nước mới (${waterNew}) không được nhỏ hơn chỉ số cũ (${waterOld})`
          })
          continue
        }

        // Check if exists
        const existing = await prisma.meterReading.findFirst({
          where: {
            roomId: parseInt(roomId),
            month: parseInt(month),
            year: parseInt(year)
          }
        })

        // Tính số tiêu thụ (số mới - số cũ)
        const elecConsumption = parseFloat(elecNew) - elecOld
        const waterConsumption = parseFloat(waterNew) - waterOld

        let meterReading
        if (existing) {
          // Update - luôn tính lại số cũ từ tháng trước để đảm bảo đúng
          meterReading = await prisma.meterReading.update({
            where: { id: existing.id },
            data: {
              elecOld, // Số cũ từ tháng trước (luôn tính lại)
              elecNew: parseFloat(elecNew),
              waterOld, // Số cũ từ tháng trước (luôn tính lại)
              waterNew: parseFloat(waterNew)
            }
          })
          results.push(meterReading)
        } else {
          // Create - chỉ tạo khi có số mới
          meterReading = await prisma.meterReading.create({
            data: {
              roomId: parseInt(roomId),
              month: parseInt(month),
              year: parseInt(year),
              elecOld, // Số cũ từ tháng trước (hoặc 0 nếu chưa có)
              elecNew: parseFloat(elecNew),
              waterOld, // Số cũ từ tháng trước (hoặc 0 nếu chưa có)
              waterNew: parseFloat(waterNew)
            }
          })
          results.push(meterReading)
        }

        // Cập nhật số cũ của tháng sau bằng số mới của tháng hiện tại
        let nextMonth = parseInt(month) + 1
        let nextYear = parseInt(year)
        if (nextMonth > 12) {
          nextMonth = 1
          nextYear += 1
        }

        // Tìm meter reading của tháng sau (nếu đã tồn tại)
        const nextMonthReading = await prisma.meterReading.findFirst({
          where: {
            roomId: parseInt(roomId),
            month: nextMonth,
            year: nextYear
          }
        })

        if (nextMonthReading) {
          // Cập nhật số cũ của tháng sau bằng số mới của tháng hiện tại
          await prisma.meterReading.update({
            where: { id: nextMonthReading.id },
            data: {
              elecOld: parseFloat(elecNew),
              waterOld: parseFloat(waterNew)
            }
          })
        }
        // Nếu chưa có reading của tháng sau, không tạo mới - sẽ tự động lấy từ tháng hiện tại khi chốt tháng sau

        // Auto-create or update invoice for active contracts
        const activeContract = await prisma.contract.findFirst({
          where: {
            roomId: parseInt(roomId),
            status: 'ACTIVE'
          },
          include: {
            room: true,
            occupants: true // Lấy danh sách người ở để tính số lượng
          } as any // Type assertion để tránh lỗi TypeScript với Prisma client chưa được generate lại
        })

        if (activeContract) {
          // Tính số người trong phòng: 1 (người chủ hợp đồng) + số người ở cùng
          const occupants = (activeContract as any).occupants || []
          const numberOfPeople = 1 + occupants.length
          
          // Tính tiền dựa trên số tiêu thụ (số mới - số cũ)
          const amountRoom = Number(activeContract.rentPrice)
          const amountElec = elecConsumption * elecPrice // Số tiêu thụ * giá điện
          const amountWater = waterConsumption * waterPrice // Số tiêu thụ * giá nước
          const amountCommonService = commonServicePrice * numberOfPeople // Phí dịch vụ chung * số người
          const amountService = 0 // Phí xử lý sự cố và dịch vụ khác (mặc định 0)
          const totalAmount = amountRoom + amountElec + amountWater + amountCommonService + amountService

          // Cho phép tạo nhiều hóa đơn trong cùng tháng (để bổ sung thiếu sót)
          // Không kiểm tra hóa đơn đã tồn tại, luôn tạo hóa đơn mới
          
          // Chỉ tạo hóa đơn mới sau khi đã lưu số mới và có số tiêu thụ
          if (elecConsumption >= 0 && waterConsumption >= 0) {
            // Calculate payment due date (10 days from now)
            const paymentDueDate = new Date()
            paymentDueDate.setDate(paymentDueDate.getDate() + 10)
            
            // Create invoice
            const invoice = await prisma.invoice.create({
              data: {
                contractId: activeContract.id,
                month: parseInt(month),
                year: parseInt(year),
                amountRoom,
                amountElec,
                amountWater,
                amountCommonService,
                amountService: 0,
                totalAmount,
                paymentDueDate,
                status: 'UNPAID'
              }
            })
            invoicesCreated.push(invoice.id)
          }
        }
      } catch (error: any) {
        console.error(`Error processing room ${roomId}:`, error)
        let errorMessage = 'Lỗi khi lưu chỉ số'
        
        // Provide more specific error messages
        if (error.code === 'P2002') {
          errorMessage = 'Phòng này đã có chỉ số cho kỳ này'
        } else if (error.code === 'P2003') {
          errorMessage = 'Phòng không tồn tại hoặc dữ liệu không hợp lệ'
        } else if (error.code === 'P2025') {
          errorMessage = 'Không tìm thấy dữ liệu liên quan'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        errors.push({
          roomId,
          error: errorMessage,
          details: error.code || undefined
        })
      }
    }

    return NextResponse.json({
      success: true,
      saved: results.length,
      invoicesCreated: invoicesCreated.length,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? `Đã lưu ${results.length} phòng, tạo ${invoicesCreated.length} hóa đơn, ${errors.length} phòng có lỗi`
        : `Đã lưu thành công ${results.length} phòng và tạo ${invoicesCreated.length} hóa đơn`
    })
  } catch (error) {
    console.error('Error saving bulk meter readings:', error)
    return NextResponse.json(
      { error: 'Failed to save meter readings' },
      { status: 500 }
    )
  }
}
