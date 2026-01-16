'use client'

import { useEffect, useState } from 'react'
import { Search, Eye, X, Save, XCircle, XCircle as XIcon, User, Calendar, MapPin, AlertCircle, Image as ImageIcon, DollarSign, FileText, Clock, CheckCircle2, XCircle as CancelIcon, Receipt } from 'lucide-react'

interface Issue {
  id: number
  title: string
  description: string
  status: string
  repairCost: number | null
  images: string[]
  createdAt: Date
  user: {
    fullName: string
    phone?: string
    email?: string
  }
  room: {
    name: string
    floor?: number
  }
}

export default function MaintenancePage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [updateData, setUpdateData] = useState({
    status: '',
    repairCost: '',
    adminNotes: ''
  })
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceData, setInvoiceData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amountRoom: '0',
    amountElec: '0',
    amountWater: '0',
    amountService: '0'
  })
  const [contract, setContract] = useState<any>(null)
  const [existingInvoice, setExistingInvoice] = useState<any>(null)

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/maintenance')
      const data = await response.json()
      setIssues(data)
    } catch (error) {
      console.error('Error fetching issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (issue: Issue) => {
    setSelectedIssue(issue)
    setSelectedImageIndex(0) // Reset to first image
    // Extract admin notes from description if exists
    const adminNotesMatch = issue.description.match(/--- Admin Notes ---\n(.+?)(?:\n\n--- Lý do hủy ---|$)/s)
    const adminNotes = adminNotesMatch ? adminNotesMatch[1].trim() : ''
    
    setUpdateData({
      status: issue.status,
      repairCost: issue.repairCost?.toString() || '',
      adminNotes: adminNotes
    })
    
    // Fetch contract for this user
    try {
      const response = await fetch(`/api/contracts?userId=${issue.user.id}&status=ACTIVE`)
      if (response.ok) {
        const contracts = await response.json()
        const activeContract = contracts.find((c: any) => c.status === 'ACTIVE')
        if (activeContract) {
          setContract(activeContract)
          setInvoiceData(prev => ({
            ...prev,
            amountRoom: '0',
            amountService: issue.repairCost?.toString() || '0'
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    }
    
    setShowSidePanel(true)
  }
  
  const handleOpenInvoiceModal = () => {
    if (!selectedIssue || !contract) return
    setExistingInvoice(null) // Reset existing invoice check
    setShowInvoiceModal(true)
  }
  
  const handleCreateInvoice = async () => {
    if (!contract || !selectedIssue) {
      alert('Không tìm thấy hợp đồng hoạt động cho khách hàng này')
      return
    }
    
    try {
      // Always create a new separate invoice for issue repair cost
      // Use a special endpoint or allow multiple invoices per period
      const response = await fetch('/api/invoices/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          issueId: selectedIssue.id,
          month: invoiceData.month,
          year: invoiceData.year,
          amountRoom: parseFloat(invoiceData.amountRoom || '0'),
          amountElec: parseFloat(invoiceData.amountElec || '0'),
          amountWater: parseFloat(invoiceData.amountWater || '0'),
          amountService: parseFloat(invoiceData.amountService || '0')
        })
      })
      
      if (response.ok) {
        const newInvoice = await response.json()
        alert(`Tạo hóa đơn riêng thành công!\nHóa đơn #${newInvoice.id} đã được tạo cho sự cố #${selectedIssue.id}.`)
        setShowInvoiceModal(false)
        setExistingInvoice(null)
        // Refresh issue list
        await fetchIssues()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi tạo hóa đơn')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Có lỗi xảy ra khi tạo hóa đơn')
    }
  }

  const handleOpenCancelModal = (issueId: number) => {
    setSelectedIssueId(issueId)
    setCancelReason('')
    setShowCancelModal(true)
  }

  const handleCancelIssue = async () => {
    if (!selectedIssueId || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn')
      return
    }

    try {
      const response = await fetch(`/api/maintenance/${selectedIssueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'CANCELLED',
          cancelReason: cancelReason.trim()
        })
      })
      if (response.ok) {
        setShowCancelModal(false)
        setSelectedIssueId(null)
        setCancelReason('')
        await fetchIssues()
        // Close side panel if it's open for this issue
        if (selectedIssue && selectedIssue.id === selectedIssueId) {
          setShowSidePanel(false)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi hủy đơn')
      }
    } catch (error) {
      console.error('Error cancelling issue:', error)
      alert('Có lỗi xảy ra khi hủy đơn')
    }
  }

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return

    try {
      const response = await fetch(`/api/maintenance/${selectedIssue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: updateData.status,
          repairCost: updateData.repairCost ? parseFloat(updateData.repairCost) : null,
          adminNotes: updateData.adminNotes
        })
      })

      if (response.ok) {
        const updatedIssue = await response.json()
        // Update selected issue with new data
        setSelectedIssue(updatedIssue)
        // Refresh issues list
        await fetchIssues()
        alert('Cập nhật thành công!')
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra khi cập nhật')
      }
    } catch (error) {
      console.error('Error updating issue:', error)
      alert('Có lỗi xảy ra khi cập nhật')
    }
  }

  const handleStatusChange = async (issueId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/maintenance/${issueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchIssues()
      }
    } catch (error) {
      console.error('Error updating issue status:', error)
    }
  }

  const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} ngày trước`
    if (hours > 0) return `${hours} giờ trước`
    return 'Vừa xong'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const pendingIssues = issues.filter(i => i.status === 'PENDING')
  const processingIssues = issues.filter(i => i.status === 'PROCESSING')
  const doneIssues = issues.filter(i => i.status === 'DONE')
  const cancelledIssues = issues.filter(i => i.status === 'CANCELLED')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Yêu cầu báo hỏng</h1>
        <p className="text-gray-600 mt-1">Quản lý tiến độ sửa chữa và bảo trì các căn hộ</p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 border border-gray-300 rounded-lg text-sm transition-colors ${
            viewMode === 'table' 
              ? 'bg-[#1e3a5f] text-white' 
              : 'hover:bg-gray-50'
          }`}
        >
          Dạng bảng
        </button>
        <button 
          onClick={() => setViewMode('kanban')}
          className={`px-4 py-2 border border-gray-300 rounded-lg text-sm transition-colors ${
            viewMode === 'kanban' 
              ? 'bg-[#1e3a5f] text-white' 
              : 'hover:bg-gray-50'
          }`}
        >
          Dạng thẻ
        </button>
      </div>

      {/* Search */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, phòng, hoặc người báo cáo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-6 ${showSidePanel ? 'lg:grid-cols-4' : 'lg:grid-cols-4'}`}>
          {/* Pending Column */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <h3 className="font-semibold text-gray-900">Chờ xử lý</h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                {pendingIssues.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingIssues.map((issue) => {
                const initials = getInitials(issue.user.fullName)
                return (
                  <div
                    key={issue.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(issue)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{issue.id}</p>
                        <p className="text-sm text-gray-700 mt-1">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {issue.room.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-xs text-gray-600">{issue.user.fullName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatRelativeTime(issue.createdAt)}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(issue.id, 'PROCESSING')
                        }}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                      >
                        Nhận đơn
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenCancelModal(issue.id)
                        }}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-1"
                      >
                        <XIcon size={14} />
                        Hủy
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Processing Column */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="font-semibold text-gray-900">Đang sửa</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {processingIssues.length}
              </span>
            </div>
            <div className="space-y-3">
              {processingIssues.map((issue) => {
                const initials = getInitials(issue.user.fullName)
                return (
                  <div
                    key={issue.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(issue)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{issue.id}</p>
                        <p className="text-sm text-gray-700 mt-1">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {issue.room.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-xs text-gray-600">{issue.user.fullName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatRelativeTime(issue.createdAt)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(issue.id, 'DONE')
                      }}
                      className="w-full mt-3 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100"
                    >
                      Xong
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <h3 className="font-semibold text-gray-900">Hoàn thành</h3>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                {doneIssues.length}
              </span>
            </div>
            <div className="space-y-3">
              {doneIssues.map((issue) => {
                const initials = getInitials(issue.user.fullName)
                return (
                  <div
                    key={issue.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(issue)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{issue.id}</p>
                        <p className="text-sm text-gray-700 mt-1">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {issue.room.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-xs text-gray-600">{issue.user.fullName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatRelativeTime(issue.createdAt)}</span>
                    </div>
                    <div className="mt-3 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium text-center">
                      Đã xử lý
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cancelled Column */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <h3 className="font-semibold text-gray-900">Đã hủy</h3>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                {cancelledIssues.length}
              </span>
            </div>
            <div className="space-y-3">
              {cancelledIssues.map((issue) => {
                const initials = getInitials(issue.user.fullName)
                const cancelReason = issue.description.includes('--- Lý do hủy ---')
                  ? issue.description.split('--- Lý do hủy ---\n')[1]?.trim() || ''
                  : ''
                return (
                  <div
                    key={issue.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(issue)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">#{issue.id}</p>
                        <p className="text-sm text-gray-700 mt-1">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {issue.room.name}
                        </p>
                      </div>
                    </div>
                    {cancelReason && (
                      <p className="text-xs text-red-600 italic mt-2 bg-red-50 p-2 rounded">
                        {cancelReason.length > 50 ? cancelReason.substring(0, 50) + '...' : cancelReason}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">{initials}</span>
                        </div>
                        <span className="text-xs text-gray-600">{issue.user.fullName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatRelativeTime(issue.createdAt)}</span>
                    </div>
                    <div className="mt-3 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium text-center">
                      Đã hủy
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Side Panel */}
      {showSidePanel && selectedIssue && (
        <div className="fixed inset-0 z-50 flex">
          {/* Background with image gallery */}
          <div 
            className="flex-1 bg-black relative overflow-hidden cursor-pointer group"
            onClick={() => setShowSidePanel(false)}
          >
            {selectedIssue.images && selectedIssue.images.length > 0 && (() => {
              const currentImage = selectedIssue.images[selectedImageIndex]
              const isValidImage = currentImage && (
                currentImage.startsWith('http://') || 
                currentImage.startsWith('https://') || 
                currentImage.startsWith('/') || 
                currentImage.startsWith('data:image/')
              )
              
              return isValidImage ? (
                <>
                  <img 
                    src={currentImage} 
                    alt={`Issue image ${selectedImageIndex + 1}`} 
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30"></div>
                  
                  {/* Image counter and navigation */}
                  {selectedIssue.images.length > 1 && (
                    <>
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
                        {selectedImageIndex + 1} / {selectedIssue.images.length}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedImageIndex(prev => 
                            prev > 0 ? prev - 1 : selectedIssue.images.length - 1
                          )
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={20} className="rotate-90" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedImageIndex(prev => 
                            prev < selectedIssue.images.length - 1 ? prev + 1 : 0
                          )
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={20} className="-rotate-90" />
                      </button>
                    </>
                  )}
                  
                  {/* Thumbnail strip at bottom */}
                  {selectedIssue.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 pb-2">
                      {selectedIssue.images.map((img, idx) => {
                        if (!img || img.trim() === '') return null
                        return (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedImageIndex(idx)
                            }}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === idx 
                                ? 'border-white scale-110' 
                                : 'border-white/30 hover:border-white/60'
                            }`}
                          >
                            <img 
                              src={img.trim()} 
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Click hint */}
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Click để đóng
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white/50 text-center">
                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Không có ảnh</p>
                  </div>
                </div>
              )
            })()}
            {(!selectedIssue.images || selectedIssue.images.length === 0) && (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="text-white/30 text-center">
                  <ImageIcon size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Không có ảnh hiện trạng</p>
                  <p className="text-sm mt-2 opacity-50">Click để đóng</p>
                </div>
              </div>
            )}
          </div>
          <div className="ml-auto w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
            {/* Header with gradient */}
            <div className="sticky top-0 z-10">
              <div className={`relative overflow-hidden ${
                selectedIssue.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                selectedIssue.status === 'PROCESSING' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                selectedIssue.status === 'DONE' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}>
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <AlertCircle size={20} />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-white text-opacity-90">Yêu cầu</span>
                          <p className="text-lg font-bold">#{selectedIssue.id}</p>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold mb-2">{selectedIssue.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-white text-opacity-90">
                        <MapPin size={14} />
                        <span>Phòng {selectedIssue.room.name}</span>
                        {selectedIssue.room.floor && <span>• Tầng {selectedIssue.room.floor}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSidePanel(false)}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <XCircle size={20} className="text-white" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      selectedIssue.status === 'PENDING' ? 'bg-yellow-400 bg-opacity-30 text-white' :
                      selectedIssue.status === 'PROCESSING' ? 'bg-blue-400 bg-opacity-30 text-white' :
                      selectedIssue.status === 'DONE' ? 'bg-green-400 bg-opacity-30 text-white' :
                      'bg-gray-400 bg-opacity-30 text-white'
                    }`}>
                      {selectedIssue.status === 'PENDING' ? 'CHỜ XỬ LÝ' :
                       selectedIssue.status === 'PROCESSING' ? 'ĐANG SỬA' :
                       selectedIssue.status === 'DONE' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Reporter Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Người báo cáo</h3>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-sm">
                      {getInitials(selectedIssue.user.fullName)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{selectedIssue.user.fullName}</p>
                    <p className="text-xs text-gray-600">Khách thuê</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm">
                    Xem hồ sơ
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-white bg-opacity-60 rounded-lg px-3 py-2">
                  <Calendar size={12} />
                  <span>
                    Đã báo cáo: {new Date(selectedIssue.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Mô tả sự cố</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedIssue.description.split('\n\n--- Admin Notes ---')[0].split('\n\n--- Lý do hủy ---')[0]}
                  </p>
                </div>
                {selectedIssue.description.includes('--- Admin Notes ---') && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                      <h4 className="text-xs font-semibold text-blue-700">Ghi chú của Admin</h4>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">
                        {selectedIssue.description.split('--- Admin Notes ---\n')[1]?.split('\n\n--- Lý do hủy ---')[0] || ''}
                      </p>
                    </div>
                  </div>
                )}
                {selectedIssue.description.includes('--- Lý do hủy ---') && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CancelIcon size={14} className="text-red-600" />
                      <h4 className="text-xs font-semibold text-red-700">Lý do hủy đơn</h4>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                      <p className="text-sm text-red-800 whitespace-pre-wrap">
                        {selectedIssue.description.split('--- Lý do hủy ---\n')[1] || ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Images Card */}
              {selectedIssue.images && selectedIssue.images.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon size={16} className="text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Ảnh hiện trạng</h3>
                    <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {selectedIssue.images.length} ảnh
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedIssue.images.map((img, idx) => {
                      if (!img || img.trim() === '') return null
                      
                      // Try to display image - if it fails, show placeholder
                      const imageSrc = img.trim()
                      
                      return (
                        <div 
                          key={idx} 
                          className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group relative"
                          onClick={() => {
                            if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
                              window.open(imageSrc, '_blank')
                            } else if (imageSrc.startsWith('/')) {
                              window.open(imageSrc, '_blank')
                            } else if (imageSrc.startsWith('data:image/')) {
                              const newWindow = window.open()
                              if (newWindow) {
                                newWindow.document.write(`<img src="${imageSrc}" style="max-width: 100%; height: auto;" />`)
                              }
                            } else {
                              // Try to open anyway
                              window.open(imageSrc, '_blank')
                            }
                          }}
                        >
                          <img 
                            src={imageSrc} 
                            alt={`Ảnh ${idx + 1}`} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                // Check if fallback already exists
                                if (!parent.querySelector('.image-fallback')) {
                                  const fallback = document.createElement('span')
                                  fallback.className = 'text-gray-400 text-xs image-fallback'
                                  fallback.textContent = `Ảnh ${idx + 1}`
                                  parent.appendChild(fallback)
                                }
                              }
                            }}
                            onLoad={(e) => {
                              // Hide fallback if image loads successfully
                              const target = e.target as HTMLImageElement
                              const parent = target.parentElement
                              if (parent) {
                                const fallback = parent.querySelector('.image-fallback')
                                if (fallback) {
                                  fallback.remove()
                                }
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                              Click để phóng to
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center flex items-center justify-center gap-1">
                    <ImageIcon size={12} />
                    Click vào ảnh để phóng to
                  </p>
                </div>
              )}

              {/* Admin Actions Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                    <Save size={16} className="text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Xử lý yêu cầu</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <DollarSign size={14} className="text-green-600" />
                      Phí xử lý sự cố (VND)
                    </label>
                    <input
                      type="number"
                      value={updateData.repairCost}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, repairCost: e.target.value }))}
                      placeholder="500,000"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Chi phí này sẽ được thêm vào hóa đơn khi tạo hóa đơn từ sự cố
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText size={14} className="text-blue-600" />
                      Ghi chú của Admin
                    </label>
                    <textarea
                      value={updateData.adminNotes}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))}
                      rows={4}
                      placeholder="Đã gọi thợ điện lạnh. Hẹn 2h chiều nay qua kiểm tra và khắc phục..."
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all shadow-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Clock size={14} className="text-purple-600" />
                      Cập nhật trạng thái
                    </label>
                    <select
                      value={updateData.status}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="PENDING">🟡 Chờ xử lý</option>
                      <option value="PROCESSING">🔵 Đang sửa</option>
                      <option value="DONE">🟢 Hoàn thành</option>
                      <option value="CANCELLED">⚫ Đã hủy</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 flex items-center gap-3 shadow-lg">
                {selectedIssue.status === 'PENDING' && (
                  <button
                    onClick={() => handleOpenCancelModal(selectedIssue.id)}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <CancelIcon size={18} />
                    <span>Hủy đơn</span>
                  </button>
                )}
                {selectedIssue.status === 'DONE' && contract && (
                  <button
                    onClick={handleOpenInvoiceModal}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <Receipt size={18} />
                    <span>Tạo hóa đơn</span>
                  </button>
                )}
                <button
                  onClick={handleUpdateIssue}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#2a4a6f] text-white rounded-lg hover:from-[#2a4a6f] hover:to-[#1e3a5f] flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <Save size={18} />
                  <span>Lưu thay đổi</span>
                </button>
                <button
                  onClick={() => setShowSidePanel(false)}
                  className="px-4 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showInvoiceModal && contract && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Receipt size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Thêm phí xử lý sự cố vào hóa đơn</h2>
                    <p className="text-sm text-gray-500">Sự cố #{selectedIssue.id}: {selectedIssue.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowInvoiceModal(false)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Khách hàng</p>
                  <p className="text-sm text-blue-700">{selectedIssue.user.fullName}</p>
                  <p className="text-xs text-blue-600 mt-1">Phòng {selectedIssue.room.name}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Hóa đơn riêng cho sự cố
                      </p>
                      <p className="text-xs text-blue-700">
                        Hóa đơn này sẽ được tạo <strong>riêng biệt</strong>, không gộp vào hóa đơn tháng hiện có.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tháng
                    </label>
                    <select
                      value={invoiceData.month}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Năm
                    </label>
                    <input
                      type="number"
                      value={invoiceData.year}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phí xử lý sự cố (VND)
                    <span className="text-xs text-gray-500 ml-2">(Sự cố #{selectedIssue.id}: {selectedIssue.title})</span>
                  </label>
                  <input
                    type="number"
                    value={invoiceData.amountService}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, amountService: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                    placeholder="Nhập phí xử lý sự cố"
                  />
                  {selectedIssue.repairCost && (
                    <p className="text-xs text-gray-500 mt-1">
                      Chi phí đã nhập: {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0
                      }).format(Number(selectedIssue.repairCost))}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Tổng cộng:</span>
                    <span className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0
                      }).format(
                        parseFloat(invoiceData.amountService || '0')
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCreateInvoice}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Receipt size={18} />
                  <span>Tạo hóa đơn riêng</span>
                </button>
                <button
                  onClick={() => {
                    setShowInvoiceModal(false)
                    setExistingInvoice(null)
                  }}
                  className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Issue Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Hủy đơn sự cố</h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedIssueId(null)
                    setCancelReason('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Vui lòng nêu rõ lý do không nhận đơn sự cố này:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={4}
              />
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleCancelIssue}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Xác nhận hủy
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedIssueId(null)
                    setCancelReason('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
