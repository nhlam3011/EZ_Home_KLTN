import crypto from 'crypto'
import querystring from 'querystring'

// VNPay Configuration
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || ''
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || ''
const VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payments/vnpay-callback'

export interface VNPayPaymentParams {
  amount: number // Amount in VND
  orderId: string // Unique order ID (invoice ID)
  orderDescription: string // Description
  orderType: string // Default: 'other'
  locale?: string // 'vn' or 'en'
  ipAddr?: string // Client IP
}

/**
 * Create VNPay payment URL
 */
export function createVNPayPaymentUrl(params: VNPayPaymentParams): string {
  const {
    amount,
    orderId,
    orderDescription,
    orderType = 'other',
    locale = 'vn',
    ipAddr = '127.0.0.1'
  } = params

  const date = new Date()
  const createDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + '00'
  const expireDate = new Date(date.getTime() + 15 * 60 * 1000) // 15 minutes
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + '00'

  const vnp_Params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderDescription,
    vnp_OrderType: orderType,
    vnp_Amount: (amount * 100).toString(), // VNPay expects amount in cents
    vnp_ReturnUrl: VNPAY_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  }

  // Sort params by key
  const sortedParams = Object.keys(vnp_Params)
    .sort()
    .reduce((acc: Record<string, string>, key) => {
      acc[key] = vnp_Params[key]]
      return acc
    }, {})

  // Create query string
  const queryString = querystring.stringify(sortedParams)

  // Create secure hash
  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET)
  hmac.update(queryString)
  const vnp_SecureHash = hmac.digest('hex')

  // Add secure hash to params
  sortedParams['vnp_SecureHash'] = vnp_SecureHash

  // Build final URL
  const finalQueryString = querystring.stringify(sortedParams)
  return `${VNPAY_URL}?${finalQueryString}`
}

/**
 * Verify VNPay callback signature
 */
export function verifyVNPayCallback(params: Record<string, string>): boolean {
  const secureHash = params['vnp_SecureHash']
  if (!secureHash) return false

  // Remove secure hash from params
  const { vnp_SecureHash, ...otherParams } = params

  // Sort params by key
  const sortedParams = Object.keys(otherParams)
    .sort()
    .reduce((acc: Record<string, string>, key) => {
      if (otherParams[key]) {
        acc[key] = otherParams[key]
      }
      return acc
    }, {})

  // Create query string
  const queryString = querystring.stringify(sortedParams)

  // Create secure hash
  const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET)
  hmac.update(queryString)
  const calculatedHash = hmac.digest('hex')

  return calculatedHash === secureHash
}

/**
 * Parse VNPay response code
 */
export function parseVNPayResponseCode(responseCode: string): {
  success: boolean
  message: string
} {
  const codeMap: Record<string, string> = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
    '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch',
    '12': 'Thẻ/Tài khoản bị khóa',
    '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
    '51': 'Tài khoản không đủ số dư để thực hiện giao dịch',
    '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng thanh toán đang bảo trì',
    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
    '99': 'Lỗi không xác định',
  }

  const message = codeMap[responseCode] || 'Lỗi không xác định'
  return {
    success: responseCode === '00',
    message,
  }
}
