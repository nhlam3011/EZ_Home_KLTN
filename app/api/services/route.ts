import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const forTenant = searchParams.get('forTenant') === 'true' // Flag để lọc dịch vụ cho tenant

    const where: any = {}

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Nếu là cho tenant, loại trừ điện, nước, phí dịch vụ chung (các dịch vụ tự động tính trong hóa đơn)
    if (forTenant) {
      where.NOT = {
        OR: [
          { name: { equals: 'Điện', mode: 'insensitive' } },
          { name: { equals: 'Nước', mode: 'insensitive' } },
          { name: { contains: 'Dịch vụ chung', mode: 'insensitive' } },
          { name: { contains: 'Phí quản lý', mode: 'insensitive' } },
          { name: { contains: 'Phí dịch vụ', mode: 'insensitive' } },
          { name: { contains: 'Quản lý', mode: 'insensitive' } },
          { name: { contains: 'dịch vụ chung', mode: 'insensitive' } }
        ]
      }
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, unitPrice, unit, isActive } = body

    if (!name || !unitPrice || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        name,
        unitPrice: parseFloat(unitPrice),
        unit,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
