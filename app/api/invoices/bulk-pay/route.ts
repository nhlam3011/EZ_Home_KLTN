import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Thanh toán nhiều hoá đơn cùng lúc (tiền mặt)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { invoiceIds } = body

        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return NextResponse.json(
                { error: 'Vui lòng chọn ít nhất một hóa đơn để thanh toán' },
                { status: 400 }
            )
        }

        const invoiceIdsNum = invoiceIds.map((id: string | number) => typeof id === 'string' ? parseInt(id) : id)

        // Kiểm tra các hoá đơn tồn tại và chưa thanh toán
        const existingInvoices = await prisma.invoice.findMany({
            where: {
                id: { in: invoiceIdsNum },
                status: { not: 'PAID' }
            }
        })

        if (existingInvoices.length === 0) {
            return NextResponse.json(
                { error: 'Không có hóa đơn nào chưa thanh toán để xử lý' },
                { status: 400 }
            )
        }

        // Cập nhật trạng thái tất cả hoá đơn sang PAID
        const updatedCount = await prisma.invoice.updateMany({
            where: {
                id: { in: existingInvoices.map(inv => inv.id) }
            },
            data: {
                status: 'PAID',
                paidAt: new Date()
            }
        })

        // Lấy thông tin chi tiết các hoá đơn đã cập nhật
        const updatedInvoices = await prisma.invoice.findMany({
            where: {
                id: { in: existingInvoices.map(inv => inv.id) }
            },
            include: {
                contract: {
                    include: {
                        room: true,
                        user: true
                    }
                }
            }
        })

        // Tính tổng tiền đã thanh toán
        const totalAmount = updatedInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

        return NextResponse.json({
            success: true,
            message: `Đã thanh toán ${updatedInvoices.length} hóa đơn`,
            updatedCount: updatedCount.count,
            totalAmount,
            invoices: updatedInvoices.map(inv => ({
                id: inv.id,
                roomName: inv.contract.room.name,
                residentName: inv.contract.user.fullName,
                month: inv.month,
                year: inv.year,
                amount: Number(inv.totalAmount)
            }))
        })
    } catch (error) {
        console.error('Error bulk paying invoices:', error)
        return NextResponse.json(
            { error: 'Lỗi khi thanh toán hóa đơn' },
            { status: 500 }
        )
    }
}
