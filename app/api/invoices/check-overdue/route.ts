import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Check and update overdue invoices based on paymentDueDate
// This should be called periodically (e.g., via cron job or scheduled task)
export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    
    // Find all unpaid invoices where paymentDueDate has passed
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'UNPAID',
        paymentDueDate: {
          lt: now
        }
      }
    })

    // Update status to OVERDUE
    if (overdueInvoices.length > 0) {
      await prisma.invoice.updateMany({
        where: {
          id: {
            in: overdueInvoices.map(inv => inv.id)
          }
        },
        data: {
          status: 'OVERDUE'
        }
      })
    }

    return NextResponse.json({
      message: `Updated ${overdueInvoices.length} invoices to OVERDUE status`,
      count: overdueInvoices.length
    })
  } catch (error) {
    console.error('Error checking overdue invoices:', error)
    return NextResponse.json(
      { error: 'Failed to check overdue invoices' },
      { status: 500 }
    )
  }
}

// GET endpoint to check overdue status (for manual trigger)
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'UNPAID',
        paymentDueDate: {
          lt: now
        }
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

    return NextResponse.json({
      count: overdueInvoices.length,
      invoices: overdueInvoices
    })
  } catch (error) {
    console.error('Error fetching overdue invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overdue invoices' },
      { status: 500 }
    )
  }
}
