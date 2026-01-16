import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET - Lấy danh sách documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const userId = parseInt(resolvedParams.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Check if prisma.document exists
    if (!prisma.document) {
      console.warn('prisma.document is undefined - Prisma client needs to be regenerated')
      return NextResponse.json(
        { 
          error: 'Prisma client chưa được cập nhật',
          details: 'Vui lòng chạy: npx prisma generate và restart dev server',
          code: 'PRISMA_CLIENT_NOT_GENERATED'
        },
        { status: 500 }
      )
    }

    try {
      const documents = await prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(documents)
    } catch (error: any) {
      // If model doesn't exist yet, return empty array
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      throw error
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST - Upload document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const userId = parseInt(resolvedParams.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string | null
    const contractId = formData.get('contractId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `doc_${userId}_${timestamp}_${sanitizedFileName}`
    const filePath = join(uploadsDir, fileName)

    // Save file
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      console.log('File saved successfully:', filePath)
    } catch (writeError: any) {
      console.error('Error writing file:', writeError)
      return NextResponse.json(
        { 
          error: 'Lỗi khi lưu file vào server',
          details: writeError.message || 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Generate URL
    const fileUrl = `/uploads/documents/${fileName}`

    // Check if prisma.document exists (Prisma client needs to be regenerated)
    if (!prisma.document) {
      // Delete the uploaded file
      try {
        const filePath = join(process.cwd(), 'public', fileUrl)
        if (existsSync(filePath)) {
          await unlink(filePath)
        }
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError)
      }
      
      return NextResponse.json(
        { 
          error: 'Prisma client chưa được cập nhật. Vui lòng chạy các lệnh sau:',
          details: '1. npx prisma generate\n2. npx prisma db push\n3. Restart dev server (npm run dev)',
          code: 'PRISMA_CLIENT_NOT_GENERATED'
        },
        { status: 500 }
      )
    }

    // Create document record
    try {
      const document = await prisma.document.create({
        data: {
          userId,
          contractId: contractId ? parseInt(contractId) : null,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          fileType: file.type,
          description: description || null
        }
      })
      return NextResponse.json(document, { status: 201 })
    } catch (error: any) {
      console.error('Error creating document record:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // If model doesn't exist, delete the uploaded file and return error
      try {
        const filePath = join(process.cwd(), 'public', fileUrl)
        if (existsSync(filePath)) {
          await unlink(filePath)
        }
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError)
      }
      
      if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
        return NextResponse.json(
          { 
            error: 'Bảng Document chưa được tạo trong database. Vui lòng chạy:',
            details: '1. npx prisma generate\n2. npx prisma db push\n3. Restart dev server',
            code: 'TABLE_NOT_EXISTS'
          },
          { status: 500 }
        )
      }
      
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'File đã tồn tại trong hệ thống' },
          { status: 400 }
        )
      }
      
      // Check for "Cannot read properties of undefined" error
      if (error.message?.includes('Cannot read properties of undefined') || error.message?.includes("reading 'create'")) {
        return NextResponse.json(
          { 
            error: 'Prisma client chưa được cập nhật. Vui lòng chạy:',
            details: '1. npx prisma generate\n2. Restart dev server (Ctrl+C rồi npm run dev)',
            code: 'PRISMA_CLIENT_NOT_GENERATED'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Lỗi khi lưu thông tin file vào database',
          details: error.message || 'Unknown error',
          code: error.code || 'UNKNOWN_ERROR'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error uploading document:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Xóa document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const userId = parseInt(resolvedParams.id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // Get document
    let document
    try {
      document = await prisma.document.findFirst({
        where: {
          id: parseInt(documentId),
          userId // Ensure user owns the document
        }
      })
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Model Document chưa được tạo trong database' },
          { status: 500 }
        )
      }
      throw error
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', document.fileUrl)
      if (existsSync(filePath)) {
        await unlink(filePath)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      // Continue even if file deletion fails
    }

    // Delete document record
    await prisma.document.delete({
      where: { id: document.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
