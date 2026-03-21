import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvoiceCreatedEmail } from '@/lib/email'

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

    const monthNum = parseInt(month)
    const yearNum = parseInt(year)

    // Get last month's readings - batch query
    let lastMonth = monthNum - 1
    let lastYear = yearNum
    if (lastMonth === 0) {
      lastMonth = 12
      lastYear -= 1
    }

    // Batch query: Get all needed data at once
    const [
      lastReadings,
      elecService,
      waterService,
      commonService,
      roomsWithContracts
    ] = await Promise.all([
      prisma.meterReading.findMany({
        where: { month: lastMonth, year: lastYear }
      }),
      prisma.service.findFirst({ where: { name: 'Điện', isActive: true } }),
      prisma.service.findFirst({ where: { name: 'Nước', isActive: true } }),
      prisma.service.findFirst({
        where: {
          OR: [
            { name: { contains: 'Dịch vụ chung', mode: 'insensitive' } },
            { name: { contains: 'Phí quản lý', mode: 'insensitive' } },
            { name: { contains: 'Phí dịch vụ', mode: 'insensitive' } },
            { name: { contains: 'Quản lý', mode: 'insensitive' } }
          ],
          isActive: true
        }
      }),
      prisma.room.findMany({
        where: {
          id: { in: readings.map((r: any) => parseInt(r.roomId)) }
        },
        include: {
          building: true,
          contracts: {
            where: { status: 'ACTIVE' },
            include: { occupants: true }
          }
        }
      })
    ])

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

    // Create maps for faster lookups
    const lastReadingsMap = new Map(lastReadings.map(r => [r.roomId, r]))
    const roomsMap = new Map(roomsWithContracts.map(r => [r.id, r]))

    // Get existing meter readings for current month
    const existingReadings = await prisma.meterReading.findMany({
      where: {
        roomId: { in: readings.map((r: any) => parseInt(r.roomId)) },
        month: monthNum,
        year: yearNum
      }
    })
    const existingReadingsMap = new Map(existingReadings.map(r => [r.roomId, r]))

    // Get contracts for all rooms
    const contracts = await prisma.contract.findMany({
      where: {
        roomId: { in: readings.map((r: any) => parseInt(r.roomId)) },
        status: 'ACTIVE'
      },
      include: {
        occupants: true,
        invoices: {
          where: {
            status: { in: ['UNPAID', 'OVERDUE'] }
          }
        }
      }
    })
    const contractsMap = new Map(contracts.map(c => [c.roomId, c]))

    // Get existing invoices for current month
    const existingInvoices = await prisma.invoice.findMany({
      where: {
        contractId: { in: contracts.map(c => c.id) },
        month: monthNum,
        year: yearNum
      }
    })
    const existingInvoicesMap = new Map(existingInvoices.map(i => [i.contractId, i]))

    // Get next month readings to update
    let nextMonth = monthNum + 1
    let nextYear = yearNum
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }

    const nextMonthReadings = await prisma.meterReading.findMany({
      where: {
        roomId: { in: readings.map((r: any) => parseInt(r.roomId)) },
        month: nextMonth,
        year: nextYear
      }
    })
    const nextMonthReadingsMap = new Map(nextMonthReadings.map(r => [r.roomId, r]))

    // Prepare data for batch operations
    const meterReadingsToCreate: any[] = []
    const meterReadingsToUpdate: any[] = []
    const meterReadingsToUpdateNext: any[] = []
    const invoicesToCreate: any[] = []
    const invoicesToUpdate: any[] = []
    const newInvoiceContractIds: number[] = []
    const errors: any[] = []

    for (const reading of readings) {
      const { roomId, elecNew, waterNew } = reading
      const roomIdNum = parseInt(roomId)

      if (elecNew === undefined || elecNew === null || waterNew === undefined || waterNew === null) {
        continue
      }

      try {
        const lastReading = lastReadingsMap.get(roomIdNum)
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

        const existing = existingReadingsMap.get(roomIdNum)

        // Tính số tiêu thụ
        const elecConsumption = parseFloat(elecNew) - elecOld
        const waterConsumption = parseFloat(waterNew) - waterOld

        if (existing) {
          meterReadingsToUpdate.push({
            where: { id: existing.id },
            data: { elecOld, elecNew: parseFloat(elecNew), waterOld, waterNew: parseFloat(waterNew) }
          })
        } else {
          meterReadingsToCreate.push({
            roomId: roomIdNum,
            month: monthNum,
            year: yearNum,
            elecOld,
            elecNew: parseFloat(elecNew),
            waterOld,
            waterNew: parseFloat(waterNew)
          })
        }

        // Update next month readings if exists
        const nextMonthReading = nextMonthReadingsMap.get(roomIdNum)
        if (nextMonthReading) {
          meterReadingsToUpdateNext.push({
            where: { id: nextMonthReading.id },
            data: { elecOld: parseFloat(elecNew), waterOld: parseFloat(waterNew) }
          })
        }

        // Handle invoice creation/update
        const activeContract = contractsMap.get(roomIdNum)
        if (activeContract) {
          const occupants = activeContract.occupants || []
          const numberOfPeople = 1 + occupants.length

          const amountRoom = Number(activeContract.rentPrice)
          const amountElec = elecConsumption * elecPrice
          const amountWater = waterConsumption * waterPrice
          const amountCommonService = commonServicePrice * numberOfPeople
          const amountService = 0
          const totalAmount = amountRoom + amountElec + amountWater + amountCommonService + amountService

          // Calculate overdue - chỉ lấy các hóa đơn của các kỳ TRƯỚC
          const overdueInvoices = (activeContract.invoices || []).filter(inv =>
            inv.year < yearNum || (inv.year === yearNum && inv.month < monthNum)
          )
          const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
          const overdueInvoicesInfo = overdueInvoices.map(inv => ({
            id: inv.id,
            month: inv.month,
            year: inv.year,
            amount: Number(inv.totalAmount)
          }))

          const existingInvoice = existingInvoicesMap.get(activeContract.id)
          const paymentDueDate = new Date()
          paymentDueDate.setDate(paymentDueDate.getDate() + 10)

          const roomData = roomsMap.get(roomIdNum)
          const building = roomData?.building

          if (existingInvoice) {
            const newStatus = existingInvoice.status === 'PAID' ? 'PAID' : 'UNPAID'
            invoicesToUpdate.push({
              where: { id: existingInvoice.id },
              data: {
                amountRoom,
                amountElec,
                amountWater,
                amountCommonService,
                overdueAmount,
                overdueInvoices: JSON.stringify(overdueInvoicesInfo),
                totalAmount: totalAmount + overdueAmount,
                paymentDueDate,
                status: newStatus,
                buildingId: building?.id || null,
                buildingName: building?.name || null,
                buildingAddress: building?.address || null,
                ...(existingInvoice.status === 'PAID' && { paidAt: existingInvoice.paidAt })
              }
            })
          } else if (elecConsumption >= 0 && waterConsumption >= 0) {
            invoicesToCreate.push({
              contractId: activeContract.id,
              month: monthNum,
              year: yearNum,
              amountRoom,
              amountElec,
              amountWater,
              amountCommonService,
              amountService: 0,
              overdueAmount,
              overdueInvoices: JSON.stringify(overdueInvoicesInfo),
              totalAmount: totalAmount + overdueAmount,
              paymentDueDate,
              status: 'UNPAID',
              buildingId: building?.id || null,
              buildingName: building?.name || null,
              buildingAddress: building?.address || null
            })
            newInvoiceContractIds.push(activeContract.id)
          }
        }
      } catch (error: any) {
        console.error(`Error processing room ${roomId}:`, error)
        let errorMessage = 'Lỗi khi lưu chỉ số'
        if (error.code === 'P2002') errorMessage = 'Phòng này đã có chỉ số cho kỳ này'
        else if (error.code === 'P2003') errorMessage = 'Phòng không tồn tại'
        else if (error.code === 'P2025') errorMessage = 'Không tìm thấy dữ liệu'

        errors.push({ roomId, error: errorMessage, details: error.code })
      }
    }

    // Execute batch operations in transaction
    await prisma.$transaction(async (tx) => {
      if (meterReadingsToCreate.length > 0) {
        await tx.meterReading.createMany({ data: meterReadingsToCreate, skipDuplicates: true })
      }
      for (const update of meterReadingsToUpdate) {
        await tx.meterReading.update(update)
      }
      for (const update of meterReadingsToUpdateNext) {
        await tx.meterReading.update(update)
      }
      if (invoicesToCreate.length > 0) {
        await tx.invoice.createMany({ data: invoicesToCreate })
      }
      for (const update of invoicesToUpdate) {
        await tx.invoice.update(update)
      }
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    // Send email notifications for newly created invoices (after transaction succeeds)
    if (newInvoiceContractIds.length > 0) {
      try {
        const newInvoices = await prisma.invoice.findMany({
          where: {
            contractId: { in: newInvoiceContractIds },
            month: monthNum,
            year: yearNum,
          },
          include: {
            contract: {
              include: {
                user: { select: { id: true, email: true, fullName: true } },
                room: { select: { name: true } }
              }
            }
          }
        })

        const period = `Tháng ${monthNum}/${yearNum}`
        const emailPromises = newInvoices
          .filter(inv => inv.contract.user.email)
          .map(inv =>
            sendInvoiceCreatedEmail(
              inv.contract.user.email!,
              inv.id,
              Number(inv.totalAmount),
              period,
              inv.contract.user.fullName,
              inv.contract.user.id
            ).catch(err => console.error(`Failed to send email for invoice #${inv.id}:`, err))
          )

        Promise.allSettled(emailPromises).then(results => {
          const sent = results.filter(r => r.status === 'fulfilled' && (r as any).value === true).length
          console.log(`Email notifications sent: ${sent}/${emailPromises.length}`)
        })
      } catch (emailError) {
        console.error('Error sending invoice email notifications:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      saved: meterReadingsToCreate.length + meterReadingsToUpdate.length,
      invoicesCreated: invoicesToCreate.length,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length > 0
        ? `Đã lưu ${meterReadingsToCreate.length + meterReadingsToUpdate.length} phòng, tạo ${invoicesToCreate.length} hóa đơn, ${errors.length} phòng có lỗi`
        : `Đã lưu thành công ${meterReadingsToCreate.length + meterReadingsToUpdate.length} phòng và tạo ${invoicesToCreate.length} hóa đơn`
    })
  } catch (error) {
    console.error('Error saving bulk meter readings:', error)
    return NextResponse.json(
      { error: 'Failed to save meter readings' },
      { status: 500 }
    )
  }
}
