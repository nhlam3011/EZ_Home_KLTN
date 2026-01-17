import nodemailer from 'nodemailer'

// Email configuration
const createTransporter = () => {
  // Use environment variables for email configuration
  // For development, you can use Gmail, Outlook, or any SMTP server
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  return transporter
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount)
}

// Format date
const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

// Send payment success email
export async function sendPaymentSuccessEmail(
  to: string,
  invoiceData: {
    id: number
    month: number
    year: number
    totalAmount: number
    paidAt: Date
    roomName: string
  }
) {
  try {
    const transporter = createTransporter()
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email service not configured. Skipping email send.')
      return { success: false, message: 'Email service not configured' }
    }

    const mailOptions = {
      from: `"EZ-Home" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `Xác nhận thanh toán hóa đơn tháng ${invoiceData.month}/${invoiceData.year} - EZ-Home`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2a4a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e3a5f; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #6b7280; }
            .detail-value { font-weight: 700; color: #111827; }
            .amount { font-size: 24px; color: #10b981; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EZ-Home</h1>
              <p>Hệ thống quản lý nhà trọ thông minh</p>
            </div>
            <div class="content">
              <h2>Xác nhận thanh toán thành công!</h2>
              <div class="success-badge">✓ Đã thanh toán</div>
              
              <p>Xin chào,</p>
              <p>Cảm ơn bạn đã thanh toán hóa đơn. Chúng tôi xác nhận đã nhận được thanh toán của bạn.</p>
              
              <div class="invoice-details">
                <h3 style="margin-top: 0; color: #1e3a5f;">Chi tiết hóa đơn</h3>
                <div class="detail-row">
                  <span class="detail-label">Mã hóa đơn:</span>
                  <span class="detail-value">INV-${invoiceData.id.toString().padStart(6, '0')}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Kỳ thanh toán:</span>
                  <span class="detail-value">Tháng ${invoiceData.month}/${invoiceData.year}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phòng:</span>
                  <span class="detail-value">${invoiceData.roomName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Ngày thanh toán:</span>
                  <span class="detail-value">${formatDate(invoiceData.paidAt)}</span>
                </div>
                <div class="detail-row" style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #1e3a5f;">
                  <span class="detail-label" style="font-size: 18px;">Tổng tiền đã thanh toán:</span>
                  <span class="amount">${formatCurrency(invoiceData.totalAmount)}</span>
                </div>
              </div>
              
              <p>Bạn có thể tải hóa đơn PDF từ hệ thống hoặc kiểm tra trong tài khoản của bạn.</p>
              
              <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
              
              <div class="footer">
                <p>Trân trọng,<br>Đội ngũ EZ-Home</p>
                <p>Email: ${process.env.SMTP_USER}<br>Hotline: 1900 1234</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Payment success email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending payment success email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send new message notification email
export async function sendMessageNotificationEmail(
  to: string,
  messageData: {
    title: string
    content: string
    from: string
    type?: 'invoice' | 'notification' | 'message'
  }
) {
  try {
    const transporter = createTransporter()
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email service not configured. Skipping email send.')
      return { success: false, message: 'Email service not configured' }
    }

    const typeLabels: Record<string, string> = {
      invoice: 'Hóa đơn',
      notification: 'Thông báo',
      message: 'Tin nhắn'
    }

    const typeLabel = typeLabels[messageData.type || 'message'] || 'Tin nhắn'

    const mailOptions = {
      from: `"EZ-Home" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `[${typeLabel}] ${messageData.title} - EZ-Home`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2a4a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e3a5f; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EZ-Home</h1>
              <p>Hệ thống quản lý nhà trọ thông minh</p>
            </div>
            <div class="content">
              <h2>${messageData.title}</h2>
              
              <p>Xin chào,</p>
              
              <div class="message-box">
                <p style="white-space: pre-wrap; margin: 0;">${messageData.content}</p>
              </div>
              
              <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và phản hồi.</p>
              
              <div class="footer">
                <p>Trân trọng,<br>${messageData.from}<br>Đội ngũ EZ-Home</p>
                <p>Email: ${process.env.SMTP_USER}<br>Hotline: 1900 1234</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Message notification email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending message notification email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send new invoice notification email
export async function sendNewInvoiceEmail(
  to: string,
  invoiceData: {
    id: number
    month: number
    year: number
    totalAmount: number
    roomName: string
    dueDate: Date
  }
) {
  try {
    const transporter = createTransporter()
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email service not configured. Skipping email send.')
      return { success: false, message: 'Email service not configured' }
    }

    const mailOptions = {
      from: `"EZ-Home" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `Hóa đơn tháng ${invoiceData.month}/${invoiceData.year} - EZ-Home`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2a4a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .invoice-badge { background: #f59e0b; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e3a5f; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #6b7280; }
            .detail-value { font-weight: 700; color: #111827; }
            .amount { font-size: 24px; color: #ef4444; font-weight: bold; }
            .cta-button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EZ-Home</h1>
              <p>Hệ thống quản lý nhà trọ thông minh</p>
            </div>
            <div class="content">
              <h2>Hóa đơn mới đã được tạo</h2>
              <div class="invoice-badge">Hóa đơn mới</div>
              
              <p>Xin chào,</p>
              <p>Hóa đơn thanh toán của bạn cho tháng ${invoiceData.month}/${invoiceData.year} đã được tạo. Vui lòng thanh toán trước ngày ${formatDate(invoiceData.dueDate)}.</p>
              
              <div class="invoice-details">
                <h3 style="margin-top: 0; color: #1e3a5f;">Chi tiết hóa đơn</h3>
                <div class="detail-row">
                  <span class="detail-label">Mã hóa đơn:</span>
                  <span class="detail-value">INV-${invoiceData.id.toString().padStart(6, '0')}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Kỳ thanh toán:</span>
                  <span class="detail-value">Tháng ${invoiceData.month}/${invoiceData.year}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phòng:</span>
                  <span class="detail-value">${invoiceData.roomName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Hạn thanh toán:</span>
                  <span class="detail-value">${formatDate(invoiceData.dueDate)}</span>
                </div>
                <div class="detail-row" style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #1e3a5f;">
                  <span class="detail-label" style="font-size: 18px;">Tổng tiền cần thanh toán:</span>
                  <span class="amount">${formatCurrency(invoiceData.totalAmount)}</span>
                </div>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tenant/invoices" class="cta-button">Xem và thanh toán hóa đơn</a>
              </p>
              
              <p>Bạn có thể thanh toán trực tuyến qua VietQR hoặc liên hệ với chúng tôi để thanh toán bằng tiền mặt.</p>
              
              <div class="footer">
                <p>Trân trọng,<br>Đội ngũ EZ-Home</p>
                <p>Email: ${process.env.SMTP_USER}<br>Hotline: 1900 1234</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('New invoice email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending new invoice email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
