/**
 * PayOS API Integration
 * Documentation: https://docs.payos.money/
 */

import PayOS from '@payos/node'

interface PayOSConfig {
  clientId: string
  apiKey: string
  checksumKey: string
}

interface CreatePaymentLinkRequest {
  orderCode: number
  amount: number
  description: string
  cancelUrl: string
  returnUrl: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
}

interface PaymentLinkResponse {
  checkoutUrl: string
  qrCode: string
  orderCode: number
}

export class PayOSService {
  private payos: PayOS
  private baseUrl: string

  constructor(config: PayOSConfig, baseUrl: string) {
    this.payos = new PayOS(config.clientId, config.apiKey, config.checksumKey)
    this.baseUrl = baseUrl
  }

  /**
   * Create payment link using PayOS API
   */
  async createPaymentLink(data: {
    orderCode: number
    amount: number
    description: string
    invoiceId: number
    buyerName?: string
    buyerEmail?: string
    buyerPhone?: string
  }): Promise<PaymentLinkResponse> {
    try {
      const requestData: CreatePaymentLinkRequest = {
        orderCode: data.orderCode,
        amount: data.amount,
        description: data.description,
        cancelUrl: `${this.baseUrl}/tenant/invoices?error=true&message=${encodeURIComponent('Thanh toán đã bị hủy')}`,
        returnUrl: `${this.baseUrl}/tenant/invoices?success=true&message=${encodeURIComponent('Thanh toán thành công!')}&invoiceId=${data.invoiceId}`,
        items: [
          {
            name: data.description.substring(0, 50),
            quantity: 1,
            price: data.amount
          }
        ],
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone
      }

      const paymentLink = await this.payos.createPaymentLink(requestData)

      return {
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode || '',
        orderCode: paymentLink.orderCode
      }
    } catch (error: any) {
      console.error('PayOS API Error:', error)
      throw new Error(error.message || 'Failed to create payment link')
    }
  }

  /**
   * Verify webhook signature
   * PayOS SDK uses checksum key from constructor to verify signature
   */
  verifyWebhookSignature(data: any, signature: string): boolean {
    try {
      // verifyPaymentWebhookData only takes data as argument
      // It uses the checksum key from PayOS constructor to verify signature
      // Returns WebhookDataType if valid, throws error if invalid
      const verifiedData = this.payos.verifyPaymentWebhookData(data)
      // If no error thrown, signature is valid
      return verifiedData !== null && verifiedData !== undefined
    } catch (error) {
      console.error('PayOS webhook verification error:', error)
      return false
    }
  }

  /**
   * Get payment information
   */
  async getPaymentInfo(orderCode: number) {
    try {
      const paymentInfo = await this.payos.getPaymentLinkInformation(orderCode)
      return paymentInfo
    } catch (error: any) {
      console.error('PayOS get payment info error:', error)
      throw new Error(error.message || 'Failed to get payment information')
    }
  }
}
