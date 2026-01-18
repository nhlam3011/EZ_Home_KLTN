/**
 * VietQR API Integration
 * Documentation: https://developer.vietqr.io/
 */

interface VietQRConfig {
  clientID: string
  apiKey: string
  accountNo: string
  accountName: string
  bankBIN?: string // 6-digit bank BIN code (e.g., 970415, 970418)
  template?: string
}

interface CreateQRRequest {
  accountNo: string
  accountName: string
  acqId: string
  amount: number
  addInfo: string
  format?: 'text' | 'compact' | 'qr_only'
  template?: string
}

interface VietQRResponse {
  code: string
  desc: string
  data?: {
    qrCode: string
    qrDataURL: string
  }
}

export class VietQRService {
  private clientID: string
  private apiKey: string
  private accountNo: string
  private accountName: string
  private bankBIN: string
  private template: string
  private baseURL = 'https://api.vietqr.io/v2'

  constructor(config: VietQRConfig) {
    this.clientID = config.clientID
    this.apiKey = config.apiKey
    this.accountName = config.accountName
    this.template = config.template || 'compact2'
    
    // Handle account number and BIN
    if (config.bankBIN) {
      // If BIN is provided separately, use it
      this.bankBIN = config.bankBIN
      this.accountNo = config.accountNo
    } else {
      // Try to extract BIN from account number (first 6 digits if starts with 970)
      const cleanAccount = config.accountNo.replace(/\D/g, '')
      if (cleanAccount.length >= 6 && /^970\d{3}/.test(cleanAccount)) {
        // Account number includes BIN
        this.bankBIN = cleanAccount.substring(0, 6)
        this.accountNo = cleanAccount.substring(6)
      } else {
        throw new Error('Bank BIN is required. Please provide VIETQR_BANK_BIN in .env or include BIN in account number (e.g., 9704151234567890)')
      }
    }
  }

  /**
   * Get bank code (acqId) - must be 6 digits
   */
  private getAcqId(): string {
    if (this.bankBIN.length !== 6) {
      throw new Error(`Bank BIN must be 6 digits, got: ${this.bankBIN}`)
    }
    return this.bankBIN
  }

  /**
   * Generate QR code for payment using VietQR API
   */
  async generateQR(data: {
    amount: number
    description: string
    invoiceId: number
  }): Promise<{ qrCode: string; qrString: string }> {
    try {
      const acqId = this.getAcqId()

      const requestData: CreateQRRequest = {
        accountNo: this.accountNo,
        accountName: this.accountName,
        acqId: acqId,
        amount: data.amount,
        addInfo: data.description.substring(0, 25), // Max 25 chars
        format: 'text',
        template: this.template
      }

      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientID,
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(requestData)
      })

      const result: VietQRResponse = await response.json()

      if (result.code !== '00') {
        throw new Error(result.desc || 'Failed to generate QR code')
      }

      if (!result.data) {
        throw new Error('No QR code data returned')
      }

      // Extract QR string from qrDataURL or use qrCode
      const qrString = result.data.qrCode || this.extractQRString(result.data.qrDataURL)

      return {
        qrCode: result.data.qrDataURL || result.data.qrCode,
        qrString: qrString
      }
    } catch (error) {
      console.error('VietQR API Error:', error)
      throw error
    }
  }

  /**
   * Extract QR string from data URL if needed
   */
  private extractQRString(qrDataURL: string): string {
    // If it's a data URL, we can't extract the string
    // The API should return qrCode field with the string
    // For now, return empty and let API handle it
    return ''
  }
}
