import crypto from 'crypto'

// VietQR Configuration
const VIETQR_API_URL = process.env.VIETQR_API_URL || 'https://api.vietqr.io/v2'
const VIETQR_CLIENT_ID = process.env.VIETQR_CLIENT_ID || ''
const VIETQR_API_KEY = process.env.VIETQR_API_KEY || ''
const VIETQR_CALLBACK_URL = process.env.VIETQR_CALLBACK_URL || 'http://localhost:3000/api/payments/vietqr/callback'

export interface VietQRPaymentParams {
  amount: number // Amount in VND
  orderId: string // Unique order ID (invoice ID)
  orderDescription: string // Description
  accountNo: string // Bank account number
  accountName: string // Bank account name
  bankCode?: string // Bank code (optional, default: '')
  qrType?: 'static' | 'dynamic' // QR type, default: 'dynamic'
}

export interface VietQRTokenResponse {
  code: string
  desc: string
  data: {
    access_token: string
    expires_in: number
  }
}

export interface VietQRGenerateResponse {
  code: string
  desc: string
  data: {
    qrCode: string // Base64 encoded QR code image
    qrDataURL: string // QR code data URL
    qrString: string // QR code string to display
  }
}

/**
 * Get VietQR access token
 */
export async function getVietQRToken(): Promise<string> {
  if (!VIETQR_CLIENT_ID || !VIETQR_API_KEY) {
    throw new Error('VietQR configuration is missing. Please check VIETQR_CLIENT_ID and VIETQR_API_KEY in .env')
  }

  const credentials = Buffer.from(`${VIETQR_CLIENT_ID}:${VIETQR_API_KEY}`).toString('base64')

  const response = await fetch(`${VIETQR_API_URL}/generate-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get VietQR token: ${errorText}`)
  }

  const data: VietQRTokenResponse = await response.json()
  
  if (data.code !== '00') {
    throw new Error(`VietQR token error: ${data.desc}`)
  }

  return data.data.access_token
}

/**
 * Generate VietQR code
 */
export async function generateVietQRCode(params: VietQRPaymentParams): Promise<VietQRGenerateResponse['data']> {
  const {
    amount,
    orderId,
    orderDescription,
    accountNo,
    accountName,
    bankCode = '',
    qrType = 'dynamic'
  } = params

  // Validate configuration
  if (!VIETQR_CLIENT_ID || !VIETQR_API_KEY) {
    throw new Error('VietQR configuration is missing. Please check VIETQR_CLIENT_ID and VIETQR_API_KEY in .env')
  }

  // Get access token
  const accessToken = await getVietQRToken()

  // Prepare request body
  const requestBody: any = {
    accountNo: accountNo,
    accountName: accountName,
    acqId: bankCode, // Bank code
    amount: amount,
    addInfo: orderDescription,
    format: 'text', // or 'compact', 'qr_only'
    template: 'compact' // or 'compact2', 'compact3'
  }

  // For dynamic QR, add order ID and callback
  if (qrType === 'dynamic') {
    requestBody.orderId = orderId
    requestBody.callbackUrl = VIETQR_CALLBACK_URL
  }

  const response = await fetch(`${VIETQR_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to generate VietQR code: ${errorText}`)
  }

  const data: VietQRGenerateResponse = await response.json()

  if (data.code !== '00') {
    throw new Error(`VietQR generate error: ${data.desc}`)
  }

  return data.data
}

/**
 * Verify VietQR callback signature
 * Note: VietQR may use different signature methods (MD5, SHA1, SHA256, HMAC)
 * This is a basic implementation - adjust based on VietQR documentation
 */
export function verifyVietQRCallback(params: Record<string, string>, signature: string): boolean {
  // VietQR signature verification logic
  // This depends on VietQR's specific implementation
  // For now, we'll verify the signature exists
  if (!signature) return false

  // TODO: Implement actual signature verification based on VietQR docs
  // Example: const calculatedHash = crypto.createHash('sha256').update(...).digest('hex')
  // return calculatedHash === signature

  return true // Placeholder - implement based on VietQR requirements
}

/**
 * Parse VietQR callback data
 */
export interface VietQRCallbackData {
  orderId: string
  amount: number
  transactionId: string
  bankCode: string
  accountNo: string
  accountName: string
  description: string
  timestamp: string
  status: 'success' | 'failed'
}

export function parseVietQRCallback(params: Record<string, string>): VietQRCallbackData {
  return {
    orderId: params.orderId || '',
    amount: parseFloat(params.amount || '0'),
    transactionId: params.transactionId || params.transId || '',
    bankCode: params.bankCode || params.acqId || '',
    accountNo: params.accountNo || '',
    accountName: params.accountName || '',
    description: params.description || params.addInfo || '',
    timestamp: params.timestamp || new Date().toISOString(),
    status: params.status === 'success' || params.status === '00' ? 'success' : 'failed'
  }
}
