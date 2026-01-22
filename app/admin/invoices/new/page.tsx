'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, X, Search } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Tạo hóa đơn mới</h1>
          <p className="text-secondary mt-1">Tạo hóa đơn thanh toán cho cư dân</p>
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
            disabled={loading || !selectedContract}
            className="px-4 py-2 btn-primary text-white rounded-lg hover:bg-[#2a4a6f] flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            <span>{loading ? 'Đang tạo...' : 'Tạo hóa đơn'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Selection */}
          <div className="bg-primary rounded-lg shadow-sm border border-primary p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Chọn hợp đồng</h2>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số phòng, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredContracts.map((contract) => (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => setSelectedContract(contract.id)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    selectedContract === contract.id
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
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
          <div className="bg-primary rounded-lg shadow-sm border border-primary p-6">
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
                    className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Hạn thanh toán
                </label>
                <input
                  type="date"
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDate: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-tertiary mt-1">Ngày hết hạn thanh toán hóa đơn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-primary rounded-lg shadow-sm border border-primary p-6 sticky top-6">
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
                <span className="text-sm text-secondary">Phí xử lý sự cố & Dịch vụ khác:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(parseFloat(formData.amountService || '0'))}
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
          </div>
        </div>
      </form>
    </div>
  )
}
