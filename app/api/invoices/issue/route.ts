import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInvoiceCreatedEmail } from '@/lib/email'

// Create a separate invoice for issue repair cost
// This allows multiple invoices for the same period
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      contractId,
      issueId,
      month,
      year,
      amountRoom,
      amountElec,
      amountWater,
      amountCommonService,
      amountService
    } = body

    // Validate required fields
    if (!contractId || !issueId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify issue exists and get room info
    const issue = await prisma.issue.findUnique({
      where: { id: parseInt(issueId) },
      include: { room: true }
    })

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    // Verify contract exists and belongs to the same room as the issue
    let finalContractId = parseInt(contractId)
    const contract = await prisma.contract.findUnique({
      where: { id: finalContractId },
      include: {
        room: {
          include: { building: true }
        }
      }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // If the contract's room doesn't match the issue's room, find the correct contract
    if (contract.roomId !== issue.roomId) {
      const correctContract = await prisma.contract.findFirst({
        where: {
          roomId: issue.roomId,
          status: 'ACTIVE'
        },
        include: {
          room: {
            include: { building: true }
          }
        }
      })

      if (!correctContract) {
        return NextResponse.json(
          { error: 'Không tìm thấy hợp đồng hoạt động cho phòng này' },
          { status: 404 }
        )
      }

      finalContractId = correctContract.id
    }

    // Get the final contract with building info
    const finalContract = finalContractId !== parseInt(contractId)
      ? await prisma.contract.findUnique({
          where: { id: finalContractId },
          include: { room: { include: { building: true } } }
        })
      : contract

    // Calculate payment due date (10 days from now)
    const paymentDueDate = new Date()
    paymentDueDate.setDate(paymentDueDate.getDate() + 10)

    const totalAmount =
      parseFloat(amountRoom || 0) +
      parseFloat(amountElec || 0) +
      parseFloat(amountWater || 0) +
      parseFloat(amountCommonService || 0) +
      parseFloat(amountService || 0)

    // Create invoice with correct contract and building info
    const invoice = await prisma.invoice.create({
      data: {
        contractId: finalContractId,
        month: parseInt(month),
        year: parseInt(year),
        amountRoom: parseFloat(amountRoom || 0),
        amountElec: parseFloat(amountElec || 0),
        amountWater: parseFloat(amountWater || 0),
        amountCommonService: parseFloat(amountCommonService || 0),
        amountService: parseFloat(amountService || 0),
        totalAmount,
        paymentDueDate,
        status: 'UNPAID',
        buildingId: finalContract?.room?.buildingId || null,
        buildingName: finalContract?.room?.building?.name || null,
        buildingAddress: finalContract?.room?.building?.address || null
      },
      include: {
        contract: {
          include: {
            user: true,
            room: true
          }
        }
      }
    })

    // Send email notification to tenant
    if (invoice.contract.user.email) {
      const period = `Tháng ${invoice.month}/${invoice.year}`
      await sendInvoiceCreatedEmail(
        invoice.contract.user.email,
        invoice.id,
        Number(invoice.totalAmount),
        period,
        invoice.contract.user.fullName
      )
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating issue invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
