'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, X, Loader2, Search, FileText, Zap, Droplet, DollarSign } from 'lucide-react'

interface Contract {
  id: number
  user: {
    fullName: string
    phone: string
  }
  room: {
    name: string
  }
  rentPrice: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selectedContract, setSelectedContract] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amountRoom: '',
    amountElec: '0',
    amountWater: '0',
    amountCommonService: '0',
    amountService: '0',
    paymentDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default: 10 days from now
  })

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  useEffect(() => {
    if (selectedContract) {
      const contract = contracts.find(c => c.id === selectedContract)
      if (contract) {
        setFormData(prev => ({
          ...prev,
          amountRoom: contract.rentPrice.toString()
        }))
      }
    }
  }, [selectedContract, contracts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContract) {
      alert('Vui lòng chọn hợp đồng')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractId: selectedContract,
          ...formData,
          amountRoom: parseFloat(formData.amountRoom),
          amountElec: parseFloat(formData.amountElec),
          amountWater: parseFloat(formData.amountWater),
          amountCommonService: parseFloat(formData.amountCommonService),
          amountService: parseFloat(formData.amountService),
          paymentDueDate: formData.paymentDueDate
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
      console.error('Error creating invoice:', error)
      alert('Có lỗi xảy ra khi tạo hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  const filteredContracts = contracts.filter(contract =>
    contract.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    contract.room.name.toLowerCase().includes(search.toLowerCase()) ||
    contract.user.phone.includes(search)
  )

  const totalAmount =
    parseFloat(formData.amountRoom || '0') +
    parseFloat(formData.amountElec || '0') +
    parseFloat(formData.amountWater || '0') +
    parseFloat(formData.amountCommonService || '0') +
    parseFloat(formData.amountService || '0');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/invoices"
            className="btn btn-ghost btn-icon"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Tạo hóa đơn mới</h1>
            <p className="text-secondary mt-1 text-sm sm:text-base">Tạo hóa đơn thanh toán cho cư dân</p>
          </div>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
          <Link
            href="/admin/invoices"
            className="btn btn-secondary btn-sm sm:btn-md"
          >
            <X size={18} />
            <span>Hủy</span>
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedContract}
            className="btn btn-primary btn-sm sm:btn-md"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Save size={18} strokeWidth={2.5} />
                <span>Tạo hóa đơn</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Contract Selection */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-primary">Chọn hợp đồng</h2>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-with-icon w-full pr-4 py-2 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredContracts.map((contract) => (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => setSelectedContract(contract.id)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${selectedContract === contract.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-primary hover:bg-tertiary'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">{contract.user.fullName}</p>
                      <p className="text-sm text-tertiary">{contract.room.name} • {contract.user.phone}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(Number(contract.rentPrice))}/tháng
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <DollarSign className="text-white" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-primary">Chi tiết hóa đơn</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Tháng
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="input"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <option key={month} value={month}>Tháng {month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Năm
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    min="2020"
                    max="2030"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Tiền phòng (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountRoom}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountRoom: e.target.value }))}
                  required
                  min="0"
                  className="input"
                  placeholder="Nhập tiền phòng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Tiền điện (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountElec}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountElec: e.target.value }))}
                  min="0"
                  className="input"
                  placeholder="Nhập tiền điện"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Tiền nước (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountWater}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountWater: e.target.value }))}
                  min="0"
                  className="input"
                  placeholder="Nhập tiền nước"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Phí dịch vụ chung (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountCommonService}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountCommonService: e.target.value }))}
                  min="0"
                  className="input"
                  placeholder="Phí quản lý, vệ sinh, bảo vệ..."
                />
                <p className="text-xs text-tertiary mt-1">Phí dịch vụ chung (quản lý, vệ sinh, bảo vệ, thang máy...)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Phí xử lý sự cố & Dịch vụ khác (VND)
                </label>
                <input
                  type="number"
                  value={formData.amountService}
                  onChange={(e) => setFormData(prev => ({ ...prev, amountService: e.target.value }))}
                  min="0"
                  className="input"
                  placeholder="Phí sửa chữa, dịch vụ khác..."
                />
                <p className="text-xs text-tertiary mt-1">Phí xử lý sự cố và các dịch vụ khác</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Hạn thanh toán
                </label>
                <input
                  type="date"
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDate: e.target.value }))}
                  required
                  className="input"
                />
                <p className="text-xs text-tertiary mt-1">Ngày hết hạn thanh toán hóa đơn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4 sm:space-y-6">
          <div className="card stat-card-blue">
            <h2 className="text-lg font-semibold text-primary mb-4">Tổng kết</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Tiền phòng:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountRoom || '0'))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Tiền điện:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountElec || '0'))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Tiền nước:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountWater || '0'))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Phí dịch vụ chung:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountCommonService || '0'))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Phí xử lý sự cố:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountService || '0'))}
                </span>
              </div>
              <div className="pt-3 border-t border-primary">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-primary">Tổng cộng:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
