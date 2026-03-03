import { prisma } from '@/lib/prisma'

/**
 * Mark overdue invoices as PAID when a current invoice is paid
 * This function is called after a successful payment
 */
export async function markOverdueInvoicesAsPaid(invoiceId: number): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
    })

    if (!invoice) {
        console.error('Invoice not found:', invoiceId)
        return
    }

    // Check if this invoice has overdue amount
    const overdueAmount = Number(invoice.overdueAmount || 0)

    if (overdueAmount <= 0) {
        console.log('No overdue amount to process for invoice:', invoiceId)
        return
    }

    let overdueInvoiceIds: number[] = []

    try {
        // Try to parse overdueInvoices JSON field
        const overdueInvoicesData = JSON.parse(invoice.overdueInvoices || '[]')
        overdueInvoiceIds = overdueInvoicesData.map((inv: any) => inv.id)
        console.log('Parsed overdue invoice IDs:', overdueInvoiceIds)
    } catch (e) {
        // If parsing fails, find overdue invoices by date for the same contract
        console.log('Failed to parse overdueInvoices, finding by date instead')
        const now = new Date()

        // Find invoices with status UNPAID or OVERDUE (try both string and enum format)
        const overdueInvoices = await prisma.$queryRaw<any[]>`
            SELECT id FROM "Invoice" 
            WHERE "contractId" = ${invoice.contractId} 
            AND "paymentDueDate" < ${now}
            AND id != ${invoiceId}
            AND status IN ('UNPAID', 'OVERDUE')
        `

        overdueInvoiceIds = overdueInvoices.map(inv => inv.id)
        console.log('Found overdue invoices by date:', overdueInvoiceIds)
    }

    // Mark overdue invoices as PAID
    if (overdueInvoiceIds.length > 0) {
        console.log('Marking overdue invoices as PAID:', overdueInvoiceIds)
        await prisma.invoice.updateMany({
            where: {
                id: { in: overdueInvoiceIds }
            },
            data: {
                status: 'PAID',
                paidAt: new Date()
            }
        })
        console.log('Successfully marked', overdueInvoiceIds.length, 'overdue invoices as PAID')
    } else {
        console.log('No overdue invoices to mark as PAID')
    }
}
