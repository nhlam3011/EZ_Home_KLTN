'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Save, X } from 'lucide-react'

interface Invoice {
  id: number
  month: number
  year: number
  amountRoom: number
  amountElec: number
  amountWater: number
  amountCommonService: number
  amountService: number
  totalAmount: number
  status: string
  contract: {
    id: number
    user: {
      fullName: string
      phone: string
    }
    room: {
      name: string
    }
  }
}

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params?.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amountRoom: '0',
    amountElec: '0',
    amountWater: '0',
    amountCommonService: '0',
    amountService: '0'
  })

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
        setFormData({
          month: data.month,
          year: data.year,
          amountRoom: data.amountRoom.toString(),
          amountElec: data.amountElec.toString(),
          amountWater: data.amountWater.toString(),
          amountCommonService: (data.amountCommonService || 0).toString(),
          amountService: data.amountService.toString()
        })
      } else {
        alert('Không tìm thấy hóa đơn')
        router.push('/admin/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      alert('Có lỗi xảy ra khi tải hóa đơn')
      router.push('/admin/invoices')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invoice) return

    setLoading(true)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: parseInt(formData.month.toString()),
          year: parseInt(formData.year.toString()),
          amountRoom: parseFloat(formData.amountRoom),
          amountElec: parseFloat(formData.amountElec),
          amountWater: parseFloat(formData.amountWater),
          amountCommonService: parseFloat(formData.amountCommonService),
          amountService: parseFloat(formData.amountService)
        })
      })

      if (response.ok) {
        router.push('/admin/invoices')
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Có lỗi xảy ra khi cập nhật hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  const totalAmount =
    parseFloat(formData.amountRoom || 0) +
    parseFloat(formData.amountElec || 0) +
    parseFloat(formData.amountWater || 0) +
    parseFloat(formData.amountCommonService || 0) +
    parseFloat(formData.amountService || 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Chỉnh sửa hóa đơn</h1>
          <p className="text-secondary mt-1">
            Hóa đơn #{invoice.id} - {invoice.contract.user.fullName} - {invoice.contract.room.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/invoices"
            className="px-4 py-2 border border-primary rounded-lg hover:bg-tertiary flex items-center gap-2"
          >
            <X size={18} />
            <span>Hủy</span>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 btn-primary text-white rounded-lg hover:bg-[#2a4a6f] flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Thông tin hợp đồng</h2>
            <div className="bg-tertiary p-4 rounded-lg">
              <p className="text-sm text-secondary mb-1">Khách thuê</p>
              <p className="font-medium text-primary">{invoice.contract.user.fullName}</p>
              <p className="text-sm text-secondary mt-2 mb-1">Phòng</p>
              <p className="font-medium text-primary">{invoice.contract.room.name}</p>
              <p className="text-sm text-secondary mt-2 mb-1">Số điện thoại</p>
              <p className="font-medium text-primary">{invoice.contract.user.phone}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Chi tiết hóa đơn</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Tháng
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="input w-full"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <option key={month} value={month}>Tháng {month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Năm
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    min="2020"
                    max="2030"
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Tiền phòng (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountRoom}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountRoom: e.target.value }))}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Tiền điện (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountElec}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountElec: e.target.value }))}
                  min="0"
                  className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Tiền nước (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountWater}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountWater: e.target.value }))}
                  min="0"
                  className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Phí dịch vụ chung (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountCommonService}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountCommonService: e.target.value }))}
                  min="0"
                  className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phí quản lý, vệ sinh, bảo vệ..."
                />
                <p className="text-xs text-tertiary mt-1">Phí dịch vụ chung (quản lý, vệ sinh, bảo vệ, thang máy...)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Phí xử lý sự cố & Dịch vụ khác (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountService}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountService: e.target.value }))}
                  min="0"
                  className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phí sửa chữa, dịch vụ khác..."
                />
                <p className="text-xs text-tertiary mt-1">Phí xử lý sự cố và các dịch vụ khác</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="card sticky top-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Tổng kết</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Tiền phòng:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountRoom || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Tiền điện:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountElec || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Tiền nước:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountWater || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Phí dịch vụ chung:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountCommonService || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Phí xử lý sự cố & Dịch vụ khác:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountService || 0))}
                </span>
              </div>
              <div className="pt-3 border-t border-primary">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-primary">Tổng cộng:</span>
                  <span className="text-lg font-bold text-[#1e3a5f]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-primary">
              <p className="text-xs text-tertiary mb-1">Trạng thái hiện tại:</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                invoice.status === 'PAID' 
                  ? 'badge badge-success' 
                  : invoice.status === 'OVERDUE'
                  ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 font-semibold'
                  : 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 font-semibold'
              }`}>
                {invoice.status === 'PAID' ? 'Đã thanh toán' : invoice.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
