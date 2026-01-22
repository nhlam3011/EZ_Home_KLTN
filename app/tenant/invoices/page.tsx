'use client'

import { useEffect, useState, useRef } from 'react'
import { Search, Download, AlertCircle, Printer } from 'lucide-react'

interface Invoice {
  id: number
  month: number
  year: number
  totalAmount: number
  status: string
  createdAt: Date
  paymentDueDate: Date
  contract: {
    user: {
      fullName: string
      phone: string
      email: string
    }
    room: {
      name: string
      floor: number
    }
    occupants?: Array<{
      id: number
      fullName: string
    }>
  }
  amountRoom: number
  amountElec: number
  amountWater: number
  amountService: number
  amountCommonService?: number
  meterReading?: {
    elecOld: number
    elecNew: number
    waterOld: number
    waterNew: number
  } | null
  quantities?: {
    elecConsumption: number
    waterConsumption: number
    numberOfPeople: number
  }
  prices?: {
    elecPrice: number
    waterPrice: number
    commonServicePrice: number
  }
  issueInfo?: {
    id: number
    title: string
  } | null
  isIssueInvoice?: boolean
  issueRepairCost?: number
  managementFee?: number
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [qrString, setQrString] = useState<string>('')
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const paymentCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const paymentCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownSuccessAlertRef = useRef(false)

  useEffect(() => {
    fetchInvoices()
    
    // Check for payment result in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const message = urlParams.get('message')
    const invoiceId = urlParams.get('invoiceId')
    
    if (success === 'true' && message) {
      alert(decodeURIComponent(message))
      // Refresh invoices
      fetchInvoices()
      // Clean URL
      window.history.replaceState({}, '', '/tenant/invoices')
    } else if (error && message) {
      alert(`Lỗi thanh toán: ${decodeURIComponent(message)}`)
      // Clean URL
      window.history.replaceState({}, '', '/tenant/invoices')
    }
  }, [search])

  useEffect(() => {
    if (invoices.length > 0 && !selectedInvoice) {
      setSelectedInvoice(invoices[0])
    }
  }, [invoices])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      // Get user from localStorage
      const userData = localStorage.getItem('user')
      let userId = null
      if (userData) {
        try {
          const user = JSON.parse(userData)
          userId = user.id
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (userId) params.append('userId', userId.toString())

      const response = await fetch(`/api/tenant/invoices?${params.toString()}`)
      const data = await response.json()
      setInvoices(data)
      if (data.length > 0 && !selectedInvoice) {
        setSelectedInvoice(data[0])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      UNPAID: { label: 'Chưa thanh toán', className: 'bg-warning-soft border border-warning-subtle text-warning text-xs font-medium px-1.5 py-0.5 rounded' },
      PAID: { label: 'Đã thanh toán', className: 'bg-success-soft border border-success-subtle text-fg-success-strong text-xs font-medium px-1.5 py-0.5 rounded' },
      OVERDUE: { label: 'Quá hạn', className: 'bg-danger-soft border border-danger-subtle text-fg-danger-strong text-xs font-medium px-1.5 py-0.5 rounded' }
    }
    return statusMap[status] || { label: status, className: 'bg-neutral-secondary-medium border border-default-medium text-heading text-xs font-medium px-1.5 py-0.5 rounded' }
  }

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) return
    
    try {
      const response = await fetch(`/api/tenant/invoices/${selectedInvoice.id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Hoa-don-${selectedInvoice.month}-${selectedInvoice.year}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Không thể tải hóa đơn. Vui lòng thử lại sau.')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Có lỗi xảy ra khi tải hóa đơn')
    }
  }

  const handlePrintInvoice = async () => {
    if (!selectedInvoice) return
    
    try {
      const response = await fetch(`/api/tenant/invoices/${selectedInvoice.id}/pdf`)
      if (response.ok) {
        const html = await response.text()
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
          // Wait for content to load then print
          setTimeout(() => {
            printWindow.print()
          }, 500)
        }
      } else {
        alert('Không thể in hóa đơn. Vui lòng thử lại sau.')
      }
    } catch (error) {
      console.error('Error printing invoice:', error)
      alert('Có lỗi xảy ra khi in hóa đơn')
    }
  }

  const handleComplain = async () => {
    if (!selectedInvoice) return
    const message = prompt('Vui lòng mô tả vấn đề bạn gặp phải với hóa đơn này:')
    if (message && message.trim()) {
      try {
        // Get user ID from localStorage
        const userData = localStorage.getItem('user')
        let userId = null
        if (userData) {
          try {
            const user = JSON.parse(userData)
            userId = user.id
          } catch (e) {
            console.error('Error parsing user data:', e)
          }
        }

        const response = await fetch(`/api/tenant/invoices/${selectedInvoice.id}/complain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            message,
            userId: userId || selectedInvoice.contract.user.id
          })
        })

        const data = await response.json()
        if (response.ok) {
          alert(data.message || 'Khiếu nại của bạn đã được gửi đến quản trị viên. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.')
        } else {
          alert(data.error || 'Có lỗi xảy ra khi gửi khiếu nại')
        }
      } catch (error) {
        console.error('Error submitting complaint:', error)
        alert('Có lỗi xảy ra khi gửi khiếu nại')
      }
    }
  }

  const handlePayOSPayment = async () => {
    if (!selectedInvoice || selectedInvoice.status !== 'UNPAID') return
    
    try {
      const confirmed = confirm(`Bạn có chắc chắn muốn thanh toán hóa đơn ${formatCurrency(Number(selectedInvoice.totalAmount))} qua PayOS?`)
      if (!confirmed) return

      setLoading(true)
      // Create payment and get checkout URL
      const response = await fetch('/api/payments/payos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id
        })
      })

      const data = await response.json()
      if (response.ok && data.checkoutUrl) {
        // PayOS returns a checkout URL - redirect to payment page
        window.open(data.checkoutUrl, '_blank')
        
        // Also show QR code if available
        if (data.qrCode) {
          setQrCode(data.qrCode)
          setQrString('')
          setPaymentId(data.paymentId)
          setShowQRModal(true)
          // Start checking payment status
          startPaymentStatusCheck(data.paymentId)
        } else {
          // If no QR code, just check status periodically
          setPaymentId(data.paymentId)
          startPaymentStatusCheck(data.paymentId)
        }
      } else {
        alert(data.error || 'Có lỗi xảy ra khi tạo liên kết thanh toán')
      }
    } catch (error) {
      console.error('Error processing PayOS payment:', error)
      alert('Có lỗi xảy ra khi xử lý thanh toán')
    } finally {
      setLoading(false)
    }
  }

  const startPaymentStatusCheck = (paymentId: number) => {
    // Clear any existing interval first
    if (paymentCheckIntervalRef.current) {
      clearInterval(paymentCheckIntervalRef.current)
    }
    if (paymentCheckTimeoutRef.current) {
      clearTimeout(paymentCheckTimeoutRef.current)
    }
    
    // Reset success alert flag
    hasShownSuccessAlertRef.current = false
    
    setCheckingPayment(true)
    
    const interval = setInterval(async () => {
      try {
        // Check payment status directly
        if (paymentId) {
          const paymentResponse = await fetch(`/api/payments/payos/status?paymentId=${paymentId}`)
          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json()
            if (paymentData.status === 'SUCCESS') {
              // Clear interval and timeout
              if (paymentCheckIntervalRef.current) {
                clearInterval(paymentCheckIntervalRef.current)
                paymentCheckIntervalRef.current = null
              }
              if (paymentCheckTimeoutRef.current) {
                clearTimeout(paymentCheckTimeoutRef.current)
                paymentCheckTimeoutRef.current = null
              }
              
              // Refresh invoices
              await fetchInvoices()
              setCheckingPayment(false)
              setShowQRModal(false)
              
              // Only show alert once
              if (!hasShownSuccessAlertRef.current) {
                hasShownSuccessAlertRef.current = true
                alert('Thanh toán thành công!')
              }
            }
          }
        }
        
        // Also check invoice status as fallback
        const response = await fetch(`/api/tenant/invoices`)
        if (response.ok) {
          const invoices = await response.json()
          const updatedInvoice = invoices.find((inv: Invoice) => inv.id === selectedInvoice?.id)
          if (updatedInvoice && updatedInvoice.status === 'PAID') {
            // Clear interval and timeout
            if (paymentCheckIntervalRef.current) {
              clearInterval(paymentCheckIntervalRef.current)
              paymentCheckIntervalRef.current = null
            }
            if (paymentCheckTimeoutRef.current) {
              clearTimeout(paymentCheckTimeoutRef.current)
              paymentCheckTimeoutRef.current = null
            }
            
            setCheckingPayment(false)
            setShowQRModal(false)
            setSelectedInvoice(updatedInvoice)
            setInvoices(invoices)
            
            // Only show alert once
            if (!hasShownSuccessAlertRef.current) {
              hasShownSuccessAlertRef.current = true
              alert('Thanh toán thành công!')
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }, 3000) // Check every 3 seconds
    
    paymentCheckIntervalRef.current = interval

    // Stop checking after 15 minutes (QR expires)
    const timeout = setTimeout(() => {
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current)
        paymentCheckIntervalRef.current = null
      }
      setCheckingPayment(false)
    }, 15 * 60 * 1000)
    
    paymentCheckTimeoutRef.current = timeout
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current)
      }
      if (paymentCheckTimeoutRef.current) {
        clearTimeout(paymentCheckTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Hóa đơn & Thanh toán</h1>
        <p className="text-sm sm:text-base text-secondary mt-1">Xem và thanh toán hóa đơn của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Panel - Invoice History */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Lịch sử hóa đơn</h2>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder=" Tìm theo tháng, năm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-sm text-tertiary text-center py-4">Đang tải...</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-tertiary text-center py-4">Không có hóa đơn</p>
              ) : (
                invoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status)
                  const isSelected = selectedInvoice?.id === invoice.id

                  return (
                    <button
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className={`w-full p-4 text-left border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-primary bg-tertiary'
                          : 'border-primary hover:bg-tertiary'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">📅</span>
                        <span className="font-medium text-primary">
                          Tháng {invoice.month}/{invoice.year}
                        </span>
                      </div>
                      <p className="text-xs text-tertiary mb-1">
                        Hạn TT: {formatDate(invoice.paymentDueDate || invoice.createdAt)}
                      </p>
                      <span className={`inline-block ${statusBadge.className} whitespace-nowrap`}>
                        {statusBadge.label}
                      </span>
                      <p className="text-sm font-semibold text-primary mt-2">
                        Tổng tiền {formatCurrency(Number(invoice.totalAmount))}
                      </p>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Invoice Details */}
        {selectedInvoice && (
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              {/* Invoice Header */}
              <div className="border-b border-primary pb-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-primary">EZ-Home Management</h2>
                    <p className="text-xs sm:text-sm text-secondary mt-1">59 - Ngõ 192 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội</p>
                    <p className="text-xs sm:text-sm text-secondary">Hotline: 1900 1234</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <h3 className="text-xl sm:text-2xl font-bold text-primary mb-2">HÓA ĐƠN</h3>
                    <p className="text-xs sm:text-sm text-secondary">Mã HĐ: INV-{selectedInvoice.id.toString().padStart(6, '0')}</p>
                    <p className="text-xs sm:text-sm text-secondary">Ngày lập: {formatDate(selectedInvoice.createdAt)}</p>
                    <p className={`text-xs sm:text-sm font-medium mt-1 ${
                      selectedInvoice.status === 'UNPAID' ? 'text-red-600 dark:text-red-400' : 'text-secondary'
                    }`}>
                      Hạn thanh toán: {formatDate(selectedInvoice.paymentDueDate || selectedInvoice.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tenant Info */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2">NGƯỜI NHẬN</h4>
                <div className="bg-tertiary p-3 sm:p-4 rounded-lg border border-primary">
                  <p className="text-xs sm:text-sm text-primary font-medium">{selectedInvoice.contract.user.fullName}</p>
                  <p className="text-xs sm:text-sm text-secondary mt-1">Phòng {selectedInvoice.contract.room.name} - Tầng {selectedInvoice.contract.room.floor}</p>
                  <p className="text-xs sm:text-sm text-secondary">SĐT: {selectedInvoice.contract.user.phone}</p>
                  <p className="text-xs sm:text-sm text-secondary">Email: {selectedInvoice.contract.user.email || 'N/A'}</p>
                </div>
              </div>

              {/* Payment Period */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-semibold text-primary mb-3">KỲ THANH TOÁN</h4>
                <div className="bg-tertiary border border-primary rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <span className="font-semibold text-primary">Tháng {selectedInvoice.month} / {selectedInvoice.year}</span>
                    <span className="hidden sm:inline text-tertiary">|</span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-secondary">
                      <span>Từ ngày: 01/{selectedInvoice.month}/{selectedInvoice.year}</span>
                      <span>Đến ngày: {new Date(selectedInvoice.year, selectedInvoice.month, 0).getDate()}/{selectedInvoice.month}/{selectedInvoice.year}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 mt-2 sm:mt-0 sm:ml-auto font-semibold ${
                      selectedInvoice.status === 'UNPAID' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        selectedInvoice.status === 'UNPAID' ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                      <span>{selectedInvoice.status === 'UNPAID' ? 'CHƯA THANH TOÁN' : 'ĐÃ THANH TOÁN'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Services Table */}
              <div className="mb-4 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-semibold text-primary mb-3">DỊCH VỤ</h4>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="table min-w-full">
                      <thead>
                        <tr>
                          <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">DỊCH VỤ</th>
                          <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">ĐƠN GIÁ</th>
                          <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">SỐ LƯỢNG</th>
                          <th className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap">THÀNH TIỀN</th>
                        </tr>
                      </thead>
                      <tbody>
                    {/* Tiền Thuê Phòng - chỉ hiển thị nếu có giá trị */}
                    {(selectedInvoice.amountRoom || 0) > 0 && (
                      <tr>
                        <td className="px-3 sm:px-4 py-3">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-primary">Tiền Thuê Phòng</p>
                            <p className="text-xs text-tertiary mt-0.5">Cố định hàng tháng</p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">{formatCurrency(Number(selectedInvoice.amountRoom))}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">1</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right whitespace-nowrap">{formatCurrency(Number(selectedInvoice.amountRoom))}</td>
                      </tr>
                    )}
                    {/* Tiền Điện - chỉ hiển thị nếu có giá trị */}
                    {(selectedInvoice.amountElec || 0) > 0 && (
                      <tr>
                        <td className="px-3 sm:px-4 py-3">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-primary">Tiền Điện</p>
                            <p className="text-xs text-tertiary mt-0.5">
                              {selectedInvoice.meterReading 
                                ? `Chỉ số: ${selectedInvoice.meterReading.elecOld} - ${selectedInvoice.meterReading.elecNew} (kWh)`
                                : 'Chỉ số điện nước'}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">
                          {selectedInvoice.prices ? formatCurrency(selectedInvoice.prices.elecPrice) : '3.500 ₫'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">
                          {selectedInvoice.quantities?.elecConsumption.toFixed(0) || '0'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right whitespace-nowrap">{formatCurrency(Number(selectedInvoice.amountElec))}</td>
                      </tr>
                    )}
                    {/* Tiền Nước - chỉ hiển thị nếu có giá trị */}
                    {(selectedInvoice.amountWater || 0) > 0 && (
                      <tr>
                        <td className="px-3 sm:px-4 py-3">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-primary">Tiền Nước</p>
                            <p className="text-xs text-tertiary mt-0.5">
                              {selectedInvoice.meterReading 
                                ? `Chỉ số: ${selectedInvoice.meterReading.waterOld} - ${selectedInvoice.meterReading.waterNew} (m³)`
                                : 'Định mức theo người'}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">
                          {selectedInvoice.prices ? formatCurrency(selectedInvoice.prices.waterPrice) : '25.000 ₫'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">
                          {selectedInvoice.quantities?.waterConsumption.toFixed(2) || '0'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right whitespace-nowrap">{formatCurrency(Number(selectedInvoice.amountWater))}</td>
                      </tr>
                    )}
                    {/* Phí xử lý sự cố - hiển thị nếu có */}
                    {(selectedInvoice.issueRepairCost || 0) > 0 && (
                      <tr>
                        <td className="px-3 sm:px-4 py-3">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-primary">Phí xử lý sự cố</p>
                            <p className="text-xs text-tertiary mt-0.5">
                              {selectedInvoice.issueInfo 
                                ? `Sự cố #${selectedInvoice.issueInfo.id}: ${selectedInvoice.issueInfo.title}`
                                : 'Chi phí sửa chữa và xử lý sự cố'}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">
                          {formatCurrency(selectedInvoice.issueRepairCost || 0)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">1</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right whitespace-nowrap">
                          {formatCurrency(selectedInvoice.issueRepairCost || 0)}
                        </td>
                      </tr>
                    )}
                    {/* Phí Dịch vụ chung - hiển thị nếu có amountCommonService */}
                    {((selectedInvoice.amountCommonService || selectedInvoice.managementFee || 0) > 0) && (
                      <tr>
                        <td className="px-3 sm:px-4 py-3">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-primary">Phí Dịch vụ chung</p>
                            <p className="text-xs text-tertiary mt-0.5">Vệ sinh, thang máy, bảo vệ, quản lý (theo đầu người)</p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">
                          {selectedInvoice.prices && selectedInvoice.prices.commonServicePrice > 0
                            ? formatCurrency(selectedInvoice.prices.commonServicePrice)
                            : formatCurrency(selectedInvoice.amountCommonService || selectedInvoice.managementFee || 0)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-secondary whitespace-nowrap">
                          {selectedInvoice.quantities?.numberOfPeople || 1}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-primary text-right whitespace-nowrap">
                          {formatCurrency(selectedInvoice.amountCommonService || selectedInvoice.managementFee || 0)}
                        </td>
                      </tr>
                    )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-primary pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <button 
                      onClick={handleDownloadPDF}
                      className="btn btn-secondary btn-sm flex-1 sm:flex-none"
                    >
                      <Download size={20} className="flex-shrink-0" />
                      <span>Tải PDF</span>
                    </button>
                    {selectedInvoice.status === 'UNPAID' && (
                      <button 
                        onClick={handlePayOSPayment}
                        disabled={loading}
                        className="btn btn-primary btn-sm flex-1 sm:flex-none"
                      >
                        <span>💳</span>
                        <span>Thanh toán PayOS</span>
                      </button>
                    )}
                    <button 
                      onClick={handleComplain}
                      className="btn btn-outline-danger btn-sm flex-1 sm:flex-none"
                    >
                      <AlertCircle size={20} className="flex-shrink-0" />
                      <span>Khiếu nại hóa đơn</span>
                    </button>
                  </div>
                  <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-primary sm:border-0">
                    <p className="text-xs sm:text-sm text-secondary mb-1">Tổng cần thanh toán</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {formatCurrency(Number(selectedInvoice.totalAmount))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">Thanh toán qua PayOS</h3>
              <button
                onClick={() => {
                  if (paymentCheckIntervalRef.current) {
                    clearInterval(paymentCheckIntervalRef.current)
                    paymentCheckIntervalRef.current = null
                  }
                  if (paymentCheckTimeoutRef.current) {
                    clearTimeout(paymentCheckTimeoutRef.current)
                    paymentCheckTimeoutRef.current = null
                  }
                  setShowQRModal(false)
                  setCheckingPayment(false)
                }}
                className="text-tertiary hover:text-primary"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-secondary mb-2">
                {qrCode ? (
                  <>Quét mã QR bằng ứng dụng ngân hàng của bạn hoặc thanh toán trực tuyến</>
                ) : (
                  <>Đang chuyển hướng đến trang thanh toán PayOS...</>
                )}
              </p>
              {qrCode && (
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64 mx-auto" />
                </div>
              )}
              <p className="text-sm text-secondary mb-2">
                Số tiền: <span className="font-bold text-primary">{formatCurrency(Number(selectedInvoice?.totalAmount || 0))}</span>
              </p>
              <p className="text-xs text-tertiary">
                Nếu cửa sổ thanh toán không mở tự động, vui lòng kiểm tra popup blocker của trình duyệt
              </p>
            </div>

            {checkingPayment && (
              <div className="text-center mb-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-sm text-secondary mt-2">Đang kiểm tra thanh toán...</p>
                <p className="text-xs text-tertiary mt-1">Vui lòng thanh toán qua app ngân hàng</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (paymentCheckIntervalRef.current) {
                    clearInterval(paymentCheckIntervalRef.current)
                    paymentCheckIntervalRef.current = null
                  }
                  if (paymentCheckTimeoutRef.current) {
                    clearTimeout(paymentCheckTimeoutRef.current)
                    paymentCheckTimeoutRef.current = null
                  }
                  setShowQRModal(false)
                  setCheckingPayment(false)
                }}
                className="btn btn-secondary btn-sm flex-1"
              >
                Đóng
              </button>
              <button
                onClick={async () => {
                  if (paymentId) {
                    // Stop checking
                    if (paymentCheckIntervalRef.current) {
                      clearInterval(paymentCheckIntervalRef.current)
                      paymentCheckIntervalRef.current = null
                    }
                    if (paymentCheckTimeoutRef.current) {
                      clearTimeout(paymentCheckTimeoutRef.current)
                      paymentCheckTimeoutRef.current = null
                    }
                    
                    // Manually confirm payment
                    try {
                      const response = await fetch(`/api/payments/payos/callback`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentId })
                      })
                      
                      if (response.ok) {
                        await fetchInvoices()
                        setShowQRModal(false)
                        setCheckingPayment(false)
                        
                        if (!hasShownSuccessAlertRef.current) {
                          hasShownSuccessAlertRef.current = true
                          alert('Đã xác nhận thanh toán thành công!')
                        }
                      } else {
                        const error = await response.json()
                        alert(error.error || 'Có lỗi xảy ra khi xác nhận thanh toán')
                      }
                    } catch (error) {
                      console.error('Error confirming payment:', error)
                      alert('Có lỗi xảy ra khi xác nhận thanh toán')
                    }
                  }
                }}
                className="btn btn-primary btn-sm flex-1"
              >
                Tôi đã thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
