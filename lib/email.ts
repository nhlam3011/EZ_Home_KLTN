import nodemailer from 'nodemailer'

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    // Only create transporter if credentials are provided
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('Email credentials not configured. Email notifications will be disabled.')
      return null
    }

    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    })
  }
  return transporter
}

// Email templates
export const emailTemplates = {
  invoiceCreated: (invoiceId: number, amount: number, period: string, tenantName: string) => ({
    subject: `Hóa đơn mới #${invoiceId} - EZ-Home`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Hóa đơn mới từ EZ-Home</h2>
        <p>Xin chào <strong>${tenantName}</strong>,</p>
        <p>Hóa đơn mới đã được tạo cho bạn:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Mã hóa đơn:</strong> #${invoiceId}</p>
          <p><strong>Kỳ thanh toán:</strong> ${period}</p>
          <p><strong>Số tiền:</strong> <span style="color: #ef4444; font-size: 18px; font-weight: bold;">${amount.toLocaleString('vi-VN')} VNĐ</span></p>
        </div>
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và thanh toán hóa đơn.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Trân trọng,<br>
          <strong>EZ-Home</strong>
        </p>
      </div>
    `,
  }),

  invoiceMessage: (invoiceId: number, message: string, tenantName: string) => ({
    subject: `Tin nhắn về hóa đơn #${invoiceId} - EZ-Home`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Tin nhắn về hóa đơn</h2>
        <p>Xin chào <strong>${tenantName}</strong>,</p>
        <p>Bạn có tin nhắn mới về hóa đơn #${invoiceId}:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Trân trọng,<br>
          <strong>EZ-Home</strong>
        </p>
      </div>
    `,
  }),

  issueStatusUpdate: (issueTitle: string, status: string, statusLabel: string, tenantName: string) => ({
    subject: `Cập nhật trạng thái sự cố: ${issueTitle} - EZ-Home`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Cập nhật trạng thái sự cố</h2>
        <p>Xin chào <strong>${tenantName}</strong>,</p>
        <p>Yêu cầu của bạn đã được cập nhật:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Tiêu đề:</strong> ${issueTitle}</p>
          <p><strong>Trạng thái mới:</strong> <span style="color: #10b981; font-weight: bold;">${statusLabel}</span></p>
        </div>
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Trân trọng,<br>
          <strong>EZ-Home</strong>
        </p>
      </div>
    `,
  }),

  generalNotification: (title: string, content: string, tenantName: string) => ({
    subject: `${title} - EZ-Home`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">${title}</h2>
        <p>Xin chào <strong>${tenantName}</strong>,</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="white-space: pre-wrap;">${content}</p>
        </div>
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Trân trọng,<br>
          <strong>EZ-Home</strong>
        </p>
      </div>
    `,
  }),
}

// Send email function
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const transporter = getTransporter()
    if (!transporter) {
      console.log('Email transporter not available. Skipping email send.')
      return false
    }

    const mailOptions = {
      from: `"EZ-Home" <${emailConfig.auth.user}>`,
      to,
      subject,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Helper functions for specific email types
export async function sendInvoiceCreatedEmail(
  email: string,
  invoiceId: number,
  amount: number,
  period: string,
  tenantName: string
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.invoiceCreated(invoiceId, amount, period, tenantName)
  return sendEmail(email, template.subject, template.html)
}

export async function sendInvoiceMessageEmail(
  email: string,
  invoiceId: number,
  message: string,
  tenantName: string
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.invoiceMessage(invoiceId, message, tenantName)
  return sendEmail(email, template.subject, template.html)
}

export async function sendIssueStatusUpdateEmail(
  email: string,
  issueTitle: string,
  status: string,
  statusLabel: string,
  tenantName: string
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.issueStatusUpdate(issueTitle, status, statusLabel, tenantName)
  return sendEmail(email, template.subject, template.html)
}

export async function sendGeneralNotificationEmail(
  email: string,
  title: string,
  content: string,
  tenantName: string
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.generalNotification(title, content, tenantName)
  return sendEmail(email, template.subject, template.html)
}
