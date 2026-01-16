'use client'

import { useEffect, useState } from 'react'
import { Search, Download, AlertCircle, QrCode, CreditCard } from 'lucide-react'

interface Invoice {
  id: number
  month: number
  year: number
  totalAmount: number
  status: string
  createdAt: Date
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
      const params = new URLSearchParams()
      if (search) params.append('search', search)

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
      UNPAID: { label: 'Chưa thanh toán', className: 'bg-red-100 text-red-700' },
      PAID: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
      OVERDUE: { label: 'Quá hạn', className: 'bg-red-100 text-red-700' }
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
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

  const handleComplain = async () => {
    if (!selectedInvoice) return
    const message = prompt('Vui lòng mô tả vấn đề bạn gặp phải với hóa đơn này:')
    if (message && message.trim()) {
      try {
        const response = await fetch(`/api/tenant/invoices/${selectedInvoice.id}/complain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        })

        const data = await response.json()
        if (response.ok) {
          alert(data.message || 'Khiếu nại của bạn đã được gửi. Chúng tôi sẽ xem xét và phản hồi trong vòng 24-48 giờ.')
        } else {
          alert(data.error || 'Có lỗi xảy ra khi gửi khiếu nại')
        }
      } catch (error) {
        console.error('Error submitting complaint:', error)
        alert('Có lỗi xảy ra khi gửi khiếu nại')
      }
    }
  }

  const handlePayment = async () => {
    if (!selectedInvoice || selectedInvoice.status !== 'UNPAID') return
    
    try {
      const confirmed = confirm(`Bạn có chắc chắn muốn thanh toán hóa đơn ${formatCurrency(Number(selectedInvoice.totalAmount))} qua VNPay?`)
      if (!confirmed) return

      // Create payment and get VNPay URL
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id
        })
      })

      const data = await response.json()
      if (response.ok && data.paymentUrl) {
        // Redirect to VNPay payment page
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Có lỗi xảy ra khi tạo giao dịch thanh toán')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Có lỗi xảy ra khi xử lý thanh toán')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hóa đơn & Thanh toán</h1>
        <p className="text-gray-600 mt-1">Xem và thanh toán hóa đơn của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Invoice History */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử hóa đơn</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tháng, năm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-sm text-gray-500 text-center py-4">Đang tải...</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Không có hóa đơn</p>
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
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">📅</span>
                        <span className="font-medium text-gray-900">
                          Tháng {invoice.month}/{invoice.year}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        Hạn TT: {formatDate(invoice.createdAt)}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Invoice Header */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">EZ-Home Management</h2>
                    <p className="text-m text-gray-600">59 - Ngõ 192 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội</p>
                    <p className="text-m text-gray-600">Hotline: 1900 1234</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">HÓA ĐƠN</h3>
                    <p className="text-sm text-gray-600">Mã HĐ: INV-{selectedInvoice.id.toString().padStart(6, '0')}</p>
                    <p className="text-sm text-gray-600">Ngày lập: {formatDate(selectedInvoice.createdAt)}</p>
                    <p className={`text-sm font-medium mt-1 ${
                      selectedInvoice.status === 'UNPAID' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      Hạn thanh toán: {formatDate(selectedInvoice.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tenant Info */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">NGƯỜI NHẬN</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 font-medium">{selectedInvoice.contract.user.fullName}</p>
                  <p className="text-sm text-gray-600">Phòng {selectedInvoice.contract.room.name} - Tầng {selectedInvoice.contract.room.floor}</p>
                  <p className="text-sm text-gray-600">SĐT: {selectedInvoice.contract.user.phone}</p>
                  <p className="text-sm text-gray-600">Email: {selectedInvoice.contract.user.email || 'N/A'}</p>
                </div>
              </div>

              {/* Payment Period */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">KỲ THANH TOÁN</h4>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-900">Tháng {selectedInvoice.month} / {selectedInvoice.year}</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-gray-600">
                    Từ ngày: 01/{selectedInvoice.month}/{selectedInvoice.year} Đến ngày: {new Date(selectedInvoice.year, selectedInvoice.month, 0).getDate()}/{selectedInvoice.month}/{selectedInvoice.year}
                  </span>
                  <span className={`inline-flex items-center gap-1 ${
                    selectedInvoice.status === 'UNPAID' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      selectedInvoice.status === 'UNPAID' ? 'bg-red-500' : 'bg-green-500'
                    }`}></span>
                    {selectedInvoice.status === 'UNPAID' ? 'CHƯA THANH TOÁN' : 'ĐÃ THANH TOÁN'}
                  </span>
                </div>
              </div>

              {/* Services Table */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">DỊCH VỤ</h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">DỊCH VỤ</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ĐƠN GIÁ</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">SỐ LƯỢNG</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">THÀNH TIỀN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Tiền Thuê Phòng - chỉ hiển thị nếu có giá trị */}
                    {(selectedInvoice.amountRoom || 0) > 0 && (
                      <tr>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Tiền Thuê Phòng</p>
                            <p className="text-xs text-gray-500">Cố định hàng tháng</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(Number(selectedInvoice.amountRoom))}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">1</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(Number(selectedInvoice.amountRoom))}</td>
                      </tr>
                    )}
                    {/* Tiền Điện - chỉ hiển thị nếu có giá trị */}
                    {(selectedInvoice.amountElec || 0) > 0 && (
                      <tr>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Tiền Điện</p>
                            <p className="text-xs text-gray-500">
                              {selectedInvoice.meterReading 
                                ? `Chỉ số: ${selectedInvoice.meterReading.elecOld} - ${selectedInvoice.meterReading.elecNew} (kWh)`
                                : 'Chỉ số điện nước'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {selectedInvoice.prices ? formatCurrency(selectedInvoice.prices.elecPrice) : '3.500 ₫'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {selectedInvoice.quantities?.elecConsumption.toFixed(0) || '0'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(Number(selectedInvoice.amountElec))}</td>
                      </tr>
                    )}
                    {/* Tiền Nước - chỉ hiển thị nếu có giá trị */}
                    {(selectedInvoice.amountWater || 0) > 0 && (
                      <tr>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Tiền Nước</p>
                            <p className="text-xs text-gray-500">
                              {selectedInvoice.meterReading 
                                ? `Chỉ số: ${selectedInvoice.meterReading.waterOld} - ${selectedInvoice.meterReading.waterNew} (m³)`
                                : 'Định mức theo người'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {selectedInvoice.prices ? formatCurrency(selectedInvoice.prices.waterPrice) : '25.000 ₫'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {selectedInvoice.quantities?.waterConsumption.toFixed(2) || '0'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(Number(selectedInvoice.amountWater))}</td>
                      </tr>
                    )}
                    {/* Phí xử lý sự cố - hiển thị nếu có */}
                    {(selectedInvoice.issueRepairCost || 0) > 0 && (
                      <tr>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Phí xử lý sự cố</p>
                            <p className="text-xs text-gray-500">
                              {selectedInvoice.issueInfo 
                                ? `Sự cố #${selectedInvoice.issueInfo.id}: ${selectedInvoice.issueInfo.title}`
                                : 'Chi phí sửa chữa và xử lý sự cố'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatCurrency(selectedInvoice.issueRepairCost || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">1</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          {formatCurrency(selectedInvoice.issueRepairCost || 0)}
                        </td>
                      </tr>
                    )}
                    {/* Phí Quản Lý & Dịch vụ - hiển thị nếu có */}
                    {(selectedInvoice.managementFee || 0) > 0 && (
                      <tr>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Phí Quản Lý & Dịch vụ</p>
                            <p className="text-xs text-gray-500">Vệ sinh, thang máy, bảo vệ (theo đầu người)</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {selectedInvoice.prices && selectedInvoice.prices.commonServicePrice > 0
                            ? formatCurrency(selectedInvoice.prices.commonServicePrice)
                            : formatCurrency(selectedInvoice.managementFee || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {selectedInvoice.quantities?.numberOfPeople || 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          {formatCurrency(selectedInvoice.managementFee || 0)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDownloadPDF}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <Download size={18} />
                      <span>Tải PDF</span>
                    </button>
                    <button 
                      onClick={handleComplain}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle size={18} />
                      <span>Khiếu nại hóa đơn</span>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Tổng cần thanh toán</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(Number(selectedInvoice.totalAmount))}
                    </p>
                  </div>
                </div>
                {selectedInvoice.status === 'UNPAID' && (
                  <button 
                    onClick={handlePayment}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    <CreditCard size={20} />
                    <span>THANH TOÁN ONLINE QUA VNPAY</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
