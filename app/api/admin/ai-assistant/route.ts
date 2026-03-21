import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { aiToolDeclarations, executeTool, tenantToolDeclarations, executeTenantTool } from '@/lib/ai-tools'

const ADMIN_SYSTEM = `Bạn là trợ lý AI quản lý vận hành bất động sản (EZ-Home).
Nhiệm vụ: Giúp Admin quản lý cư dân, phòng, hợp đồng, hoá đơn, sự cố và báo cáo doanh thu.
Khả năng mới: 
1. Bạn có thể truy vấn dữ liệu từ NHIỀU tòa nhà khác nhau. Hãy dùng tool get_building_list để xem danh sách tòa nhà trước khi tra cứu phòng hay cư dân nếu Admin hỏi chung chung.
2. Bạn có thể TỰ ĐỘNG THỰC HIỆN LỆNH: Tạo hoá đơn, thêm cư dân, cập nhật trạng thái phòng... khi Admin yêu cầu. Đừng chỉ trả lời suông, hãy gọi tool tương ứng ngay lập tức.
3. Khi tạo hoá đơn, nếu Admin cung cấp các số liệu cụ thể (tiền điện, nước, dịch vụ), hãy dùng chúng làm tham số cho tool create_invoice.

Quy tắc:
- LUÔN LUÔN gọi tool (function call) để lấy dữ liệu thực tế từ database. Không bao giờ tự bịa số liệu.
- Trình bày thông tin dạng bảng hoặc danh sách sạch sẽ.
- Nếu thiếu thông tin để thực hiện tác vụ (như tạo hoá đơn thiếu tháng/năm), hãy hỏi lại admin.
- Sử dụng công cụ (tool calls) bất cứ khi nào cần truy xuất hoặc thay đổi dữ liệu.
- Format tiền dạng VNĐ và ngày DD/MM/YYYY.`

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
    const { message, history, role, userId, buildingId } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Tin nhắn trống' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // Fetch building info if buildingId is provided
    let buildingInfoText = ''
    if (buildingId && buildingId !== 'all') {
      const { prisma } = await import('@/lib/prisma')
      const building = await prisma.building.findUnique({
        where: { id: parseInt(buildingId) }
      })
      if (building) {
        buildingInfoText = `\n\nBạn đang hỗ trợ cho tòa nhà: ${building.name} (Địa chỉ: ${building.address}). Mọi câu hỏi về phòng, cư dân, hoá đơn... nếu không chỉ định rõ tòa nhà khác thì mặc định là của tòa nhà này.`
      }
    }

    const isTenant = role === 'TENANT'
    const systemPrompt = (isTenant ? TENANT_SYSTEM : ADMIN_SYSTEM) + buildingInfoText
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
            : await executeTool(fc.name, fc.args || {}, buildingId ? parseInt(buildingId) : undefined)
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
