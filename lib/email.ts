import nodemailer from 'nodemailer'
import { prisma } from './prisma'

// Email notification types for granular settings
export type EmailNotificationType = 'invoice' | 'issue' | 'message' | 'general' | 'complaint'

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

const WEBSITE_URL = 'https://ezhome.cloud'

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
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

// Shared Template Wrapper
const emailLayout = (title: string, content: string, ctaText?: string, ctaUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
    
    <!-- Brand Header -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 40px; text-align: left;">
      <div style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
        EZ-Home
      </div>
      <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px; font-weight: 500; margin-top: 4px;">
        Hệ thống quản lý nhà trọ thông minh
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px; font-weight: 700; line-height: 1.3;">
        ${title}
      </h2>
      <div style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        ${content}
      </div>

      ${ctaText && ctaUrl ? `
        <div style="text-align: center; margin-top: 30px;">
          <a href="${ctaUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-weight: 700; font-size: 16px; padding: 14px 32px; text-decoration: none; border-radius: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);">
            ${ctaText}
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 32px 40px; text-align: center;">
      <div style="margin-bottom: 20px;">
        <a href="${WEBSITE_URL}" style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px;">ezhome.cloud</a>
      </div>
      <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500;">
        Email này được gửi tự động từ hệ thống quản lý EZ-Home.
      </p>
      <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px;">
        © 2026 EZ-Home Management System. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`

// Email templates
export const emailTemplates = {
  invoiceCreated: (invoiceId: number, amount: number, period: string, tenantName: string) => {
    const content = `
      <p>Xin chào <strong>${tenantName}</strong>,</p>
      <p>Một hóa đơn mới đã được tạo cho bạn vào kỳ thanh toán <strong>${period}</strong>.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 24px 0;">
        <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin-bottom: 8px;">Số tiền cần thanh toán</div>
        <div style="font-size: 32px; font-weight: 800; color: #ef4444;">${amount.toLocaleString('vi-VN')} VNĐ</div>
        <div style="font-size: 14px; color: #64748b; margin-top: 12px;">Mã hóa đơn: <span style="color: #1e293b; font-weight: 600;">#${invoiceId}</span></div>
      </div>
      <p>Vui lòng đăng nhập để thanh toán sớm và tránh các khoản phí trễ hạn.</p>
    `
    return {
      subject: `📢 Thông báo hóa đơn mới #${invoiceId} - EZ-Home`,
      html: emailLayout(`Hóa đơn mới tháng ${period}`, content, 'Thanh toán ngay', `${WEBSITE_URL}/tenant/invoices`)
    }
  },

  invoiceMessage: (invoiceId: number, message: string, tenantName: string) => {
    const content = `
      <p>Xin chào <strong>${tenantName}</strong>,</p>
      <p>Quản lý hệ thống vừa gửi tin nhắn cho bạn về hóa đơn <strong>#${invoiceId}</strong>:</p>
      <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 16px 16px 0; margin: 24px 0; font-style: italic; color: #334155;">
        ${message}
      </div>
    `
    return {
      subject: `✉️ Phản hồi về hóa đơn #${invoiceId} - EZ-Home`,
      html: emailLayout('Trao đổi về hóa đơn', content, 'Xem chi tiết', `${WEBSITE_URL}/tenant/invoices`)
    }
  },

  issueStatusUpdate: (issueTitle: string, status: string, statusLabel: string, tenantName: string) => {
    const content = `
      <p>Xin chào <strong>${tenantName}</strong>,</p>
      <p>Báo cáo sự cố của bạn đã có cập nhật mới về trạng thái:</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
        <div style="font-size: 15px; color: #166534; font-weight: 600; margin-bottom: 8px;">"${issueTitle}"</div>
        <div style="font-size: 18px; font-weight: 800; color: #15803d; text-transform: uppercase;">${statusLabel}</div>
      </div>
      <p>Đội ngũ kỹ thuật đang tiếp tục xử lý yêu cầu của bạn.</p>
    `
    return {
      subject: `🛠️ Cập nhật bảo trì: ${issueTitle} - EZ-Home`,
      html: emailLayout('Trạng thái xử lý sự cố', content, 'Xem tiến độ', `${WEBSITE_URL}/tenant/issues`)
    }
  },

  generalNotification: (title: string, content: string, tenantName: string) => {
    const bodyContent = `
      <p>Xin chào <strong>${tenantName}</strong>,</p>
      <div style="color: #334155; margin: 24px 0;">
        ${content}
      </div>
    `
    return {
      subject: `🔔 ${title} - EZ-Home`,
      html: emailLayout(title, bodyContent, 'Xem trên hệ thống', WEBSITE_URL)
    }
  },

  messageReceived: (senderName: string, content: string, tenantName: string, hasImages: boolean) => {
    const bodyContent = `
      <p>Xin chào <strong>${tenantName}</strong>,</p>
      <p>Bạn vừa nhận được một tin nhắn cá nhân từ <strong>${senderName}</strong>:</p>
      <div style="background-color: #eff6ff; border-radius: 20px; padding: 20px; margin: 24px 0; color: #1e3a8a;">
        ${content ? `<p style="margin: 0; white-space: pre-wrap;">${content}</p>` : ''}
        ${hasImages ? '<p style="color: #3b82f6; font-size: 13px; font-weight: 700; margin-top: 12px; display: flex; items-center gap: 2px;">📷 [Tin nhắn kèm theo hình ảnh]</p>' : ''}
      </div>
    `
    return {
      subject: `💬 Tin nhắn mới từ ${senderName} - EZ-Home`,
      html: emailLayout('Bạn có tin nhắn mới', bodyContent, 'Mở trò chuyện', `${WEBSITE_URL}/tenant/messages`)
    }
  },

  invoiceComplaint: (invoiceId: number, tenantName: string, roomName: string, amount: number, complaint: string) => {
    const bodyContent = `
      <p>Xin chào <strong>Quản trị viên</strong>,</p>
      <p>Có một khiếu nại mới từ khách thuê liên quan đến tài chính:</p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 24px; margin: 24px 0;">
        <table style="width: 100%; font-size: 14px; color: #991b1b;">
          <tr><td style="padding: 4px 0; font-weight: 700;">Hóa đơn:</td><td style="padding: 4px 0;">#${invoiceId}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: 700;">Khách thuê:</td><td style="padding: 4px 0;">${tenantName}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: 700;">Phòng:</td><td style="padding: 4px 0;">${roomName}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: 700;">Số tiền:</td><td style="padding: 4px 0; font-weight: 800;">${amount.toLocaleString('vi-VN')} VNĐ</td></tr>
        </table>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #fecaca; color: #374151; font-style: italic;">
          "${complaint}"
        </div>
      </div>
    `
    return {
      subject: `🚨 Khiếu nại tài chính #${invoiceId} - EZ-Home`,
      html: emailLayout('Yêu cầu xử lý khiếu nại', bodyContent, 'Xử lý ngay', `${WEBSITE_URL}/admin/invoices`)
    }
  },
}

// Send email function
// Check per-user email setting (for tenant)
export async function checkUserEmailSetting(
  userId: number,
  notificationType: EmailNotificationType
): Promise<boolean> {
  try {
    const userSetting = await prisma.settings.findUnique({
      where: { key: `user_${userId}_email_notify_${notificationType}` }
    })
    // Default: enabled if no setting found
    if (userSetting && userSetting.value === 'false') {
      console.log(`User ${userId} has disabled email for ${notificationType}. Skipping.`)
      return false
    }
    return true
  } catch {
    return true // Default: enabled
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  notificationType?: EmailNotificationType,
  userId?: number
): Promise<boolean> {
  try {
    // Check global email notifications toggle
    const globalSetting = await prisma.settings.findUnique({
      where: { key: 'email_notifications' }
    })
    if (globalSetting && globalSetting.value === 'false') {
      console.log('Email notifications are globally disabled. Skipping.')
      return false
    }

    // Check per-type setting (admin-level)
    if (notificationType) {
      const typeSetting = await prisma.settings.findUnique({
        where: { key: `email_notify_${notificationType}` }
      })
      if (typeSetting && typeSetting.value === 'false') {
        console.log(`Email type '${notificationType}' is disabled. Skipping.`)
        return false
      }
    }

    // Check per-user setting
    if (userId && notificationType) {
      const userAllowed = await checkUserEmailSetting(userId, notificationType)
      if (!userAllowed) return false
    }

    const transporter = getTransporter()
    if (!transporter) {
      console.log('Email transporter not available. Skipping email send.')
      return false
    }

    const mailOptions = {
      from: `"EZ-Home Management" <${emailConfig.auth.user}>`,
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
  tenantName: string,
  userId?: number
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.invoiceCreated(invoiceId, amount, period, tenantName)
  return sendEmail(email, template.subject, template.html, 'invoice', userId)
}

export async function sendInvoiceMessageEmail(
  email: string,
  invoiceId: number,
  message: string,
  tenantName: string,
  userId?: number
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.invoiceMessage(invoiceId, message, tenantName)
  return sendEmail(email, template.subject, template.html, 'invoice', userId)
}

export async function sendIssueStatusUpdateEmail(
  email: string,
  issueTitle: string,
  status: string,
  statusLabel: string,
  tenantName: string,
  userId?: number
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.issueStatusUpdate(issueTitle, status, statusLabel, tenantName)
  return sendEmail(email, template.subject, template.html, 'issue', userId)
}

export async function sendGeneralNotificationEmail(
  email: string,
  title: string,
  content: string,
  tenantName: string,
  userId?: number
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.generalNotification(title, content, tenantName)
  return sendEmail(email, template.subject, template.html, 'general', userId)
}

export async function sendMessageReceivedEmail(
  email: string,
  senderName: string,
  content: string,
  tenantName: string,
  hasImages: boolean,
  userId?: number
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.messageReceived(senderName, content, tenantName, hasImages)
  return sendEmail(email, template.subject, template.html, 'message', userId)
}

export async function sendInvoiceComplaintEmail(
  email: string,
  invoiceId: number,
  tenantName: string,
  roomName: string,
  amount: number,
  complaint: string
): Promise<boolean> {
  if (!email) return false
  const template = emailTemplates.invoiceComplaint(invoiceId, tenantName, roomName, amount, complaint)
  return sendEmail(email, template.subject, template.html, 'complaint')
}
