import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { aiToolDeclarations, executeTool, tenantToolDeclarations, executeTenantTool } from '@/lib/ai-tools'

const ADMIN_SYSTEM = `Bạn là trợ lý AI quản lý nhà trọ EZ-Home. Bạn giúp admin quản lý phòng trọ, cư dân, hoá đơn, hợp đồng, bảo trì.

Nguyên tắc:
- Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng
- Khi user hỏi thông tin, hãy dùng tools để lấy dữ liệu thực từ database
- Khi user yêu cầu thực hiện hành động (thêm cư dân, tạo hoá đơn...), hãy xác nhận lại trước khi thực hiện nếu thiếu thông tin
- Format số tiền dạng VNĐ (VD: 5.000.000 VNĐ)
- Format ngày dạng DD/MM/YYYY
- Dùng emoji phù hợp để trả lời sinh động hơn
- Khi trả về danh sách, format dạng bảng hoặc bullets cho dễ đọc
- Nếu không có dữ liệu, hãy nói rõ thay vì bịa số liệu`

const TENANT_SYSTEM = `Bạn là trợ lý AI cho khách thuê nhà trọ EZ-Home. Bạn CHỈ được phép xem thông tin CỦA CHÍNH KHÁCH THUÊ ĐANG ĐĂNG NHẬP.

Bạn có thể giúp:
- Xem hoá đơn CỦA KHÁCH THUÊ NÀY (dùng tenant_get_my_invoices)
- Thanh toán hoá đơn: Cung cấp thông tin và link thanh toán (dùng tenant_get_payment_info)
- Xem hợp đồng CỦA KHÁCH THUÊ NÀY (dùng tenant_get_my_contract)
- Gia hạn hợp đồng: Gửi yêu cầu gia hạn cho admin (dùng tenant_request_renewal)
- Xem thông tin phòng CỦA KHÁCH THUÊ NÀY (dùng tenant_get_my_room)
- Xem sự cố bảo trì do KHÁCH THUÊ NÀY báo (dùng tenant_get_my_issues)
- Xem thông tin cá nhân (dùng tenant_get_my_info)

QUAN TRỌNG: 
- KHÔNG BAO GIỜ trả về thông tin của người khác.
- Nếu khách muốn thanh toán, hãy dùng tenant_get_payment_info và đưa link /tenant/invoices.
- Nếu khách muốn gia hạn, hãy hỏi số tháng (mặc định 6) rồi dùng tenant_request_renewal.
- Trả lời thân thiện bằng tiếng Việt, dùng emoji. Luôn nhắc khách rằng yêu cầu gia hạn cần admin phê duyệt.`

export async function POST(request: NextRequest) {
  try {
    const { message, history, role, userId } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Tin nhắn trống' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const isTenant = role === 'TENANT'
    const systemPrompt = isTenant ? TENANT_SYSTEM : ADMIN_SYSTEM
    const toolDecls = isTenant ? tenantToolDeclarations : aiToolDeclarations

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: toolDecls }],
    })

    // Build valid history
    const validHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        const geminiRole = msg.role === 'user' ? 'user' as const : 'model' as const
        if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === geminiRole) continue
        validHistory.push({ role: geminiRole, parts: [{ text: msg.content }] })
      }
      while (validHistory.length > 0 && validHistory[0].role !== 'user') validHistory.shift()
      while (validHistory.length > 0 && validHistory[validHistory.length - 1].role !== 'model') validHistory.pop()
    }

    const chat = model.startChat({ history: validHistory })

    let result = await chat.sendMessage(message)
    let response = result.response
    let iterations = 0

    while (iterations < 5) {
      const functionCalls = response.functionCalls()
      if (!functionCalls || functionCalls.length === 0) break

      const functionResponses = []
      for (const fc of functionCalls) {
        console.log(`[AI][${role}] Tool: ${fc.name}`)
        try {
          // Tenant tools get userId injected, admin tools don't
          const toolResult = isTenant
            ? await executeTenantTool(fc.name, fc.args || {}, userId)
            : await executeTool(fc.name, fc.args || {})
          functionResponses.push({
            functionResponse: { name: fc.name, response: { result: toolResult } },
          })
        } catch (toolErr: any) {
          functionResponses.push({
            functionResponse: { name: fc.name, response: { error: toolErr.message } },
          })
        }
      }

      result = await chat.sendMessage(functionResponses)
      response = result.response
      iterations++
    }

    return NextResponse.json({ response: response.text(), toolsUsed: iterations > 0 })
  } catch (error: any) {
    console.error('[AI Assistant] Error:', error?.message || error)
    return NextResponse.json({
      response: '⚠️ Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại.',
      toolsUsed: false,
    })
  }
}
