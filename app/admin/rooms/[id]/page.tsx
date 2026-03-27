'use client'

import { useEffect, useState, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Building2, Users, DollarSign, Ruler, Home, Wrench, FileText, AlertCircle, ChevronDown, CheckCircle, Trash2, Sparkles, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { useBuilding } from '@/components/BuildingContext'
import Loading from '@/components/Loading'

interface RoomTypePreset {
  type: string
  price: number
  area: number
  amenities: string[]
}

interface Room {
  id: number
  name: string
  floor: number
  price: number
  area: number | null
  maxPeople: number
  status: string
  roomType?: string | null
  description?: string | null
  amenities?: string[]
  buildingId?: number
  contracts: Array<{
    id: number
    startDate: Date | string
    endDate: Date | string
    user: {
      id: number
      fullName: string
      phone: string
    }
  }>
}

export default function EditRoomPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const roomId = params?.id as string
  const { buildings } = useBuilding()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [buildingDetails, setBuildingDetails] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    floor: '',
    area: '',
    maxPeople: '2',
    price: '',
    status: 'AVAILABLE',
    roomType: '',
    description: '',
    amenities: [] as string[],
    buildingId: ''
  })

  useEffect(() => {
    if (roomId) {
      fetchRoom()
    }
  }, [roomId])

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      const data = await response.json()

      if (response.ok) {
        setRoom(data)
        setFormData({
          name: data.name || '',
          floor: data.floor?.toString() || '',
          area: data.area?.toString() || '',
          maxPeople: data.maxPeople?.toString() || '2',
          price: data.price?.toString() || '',
          status: data.status || 'AVAILABLE',
          roomType: data.roomType || '',
          description: data.description || '',
          amenities: data.amenities || [],
          buildingId: data.buildingId?.toString() || ''
        })
      } else {
        alert(data.error || 'Không tìm thấy phòng')
        router.push('/admin/rooms')
      }
    } catch (error) {
      console.error('Error fetching room:', error)
      alert('Có lỗi xảy ra khi tải thông tin phòng')
    } finally {
      setLoading(false)
    }
  }

  // Fetch building details to get presets when buildingId changes
  useEffect(() => {
    const fetchBuildingData = async () => {
      if (!formData.buildingId) return
      try {
        const res = await fetch(`/api/admin/buildings/${formData.buildingId}`)
        const data = await res.json()
        if (data.building) {
          setBuildingDetails(data.building)
        }
      } catch (error) {
        console.error('Error fetching building details:', error)
      }
    }
    fetchBuildingData()
  }, [formData.buildingId])

  const handleRoomTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value
    setFormData(prev => ({ ...prev, roomType: type }))
    
    // Auto-fill logic
    if (buildingDetails?.roomTypePresets) {
      const preset = buildingDetails.roomTypePresets.find((p: RoomTypePreset) => p.type === type)
      if (preset) {
        setFormData(prev => ({
          ...prev,
          price: preset.price.toString(),
          area: preset.area.toString(),
          amenities: preset.amenities || []
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/rooms')
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error updating room:', error)
      alert('Có lỗi xảy ra khi cập nhật phòng')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenity] 
        : prev.amenities.filter(a => a !== amenity)
    }))
  }

  const availableAmenityOptions = [
    'Điều hòa', 'Nóng lạnh', 'Giường', 'Tủ quần áo', 'Máy giặt', 'Tủ lạnh', 'Bếp', 'Wifi', 'Ban công', 'Cửa sổ', 'Thang máy', 'Bảo vệ 24/7'
  ]

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <Loading size="lg" />
        <p className="text-tertiary mt-4 animate-pulse uppercase text-[10px] font-black tracking-widest">Đang tải dữ liệu phòng...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Standardized Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <Link href="/admin/rooms" className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center text-secondary hover:bg-tertiary transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary uppercase tracking-tight">CHỈNH SỬA PHÒNG: {room?.name}</h1>
            <p className="text-xs sm:text-sm text-secondary mt-1 tracking-wide">
              Cập nhật thông tin chi tiết và cấu hình của phòng
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/admin/rooms"
            className="btn btn-secondary h-11 px-6 flex-1 sm:flex-none font-bold uppercase tracking-wider text-xs flex items-center justify-center"
          >
            Hủy bỏ
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary h-11 px-8 shadow-lg shadow-blue-500/20 flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            {saving ? (
               <Loading size="sm" />
            ) : (
              <>
                <Save size={18} strokeWidth={2.5} />
                <span className="font-bold">Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contracts Section if active */}
          {room?.contracts && room.contracts.length > 0 && (
            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đang có hợp đồng</p>
                  <p className="text-base font-bold text-primary">{room.contracts[0].user.fullName}</p>
                </div>
              </div>
              <Link href={`/admin/contracts/${room.contracts[0].id}`} className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
                Xem chi tiết <Wand2 size={12} />
              </Link>
            </div>
          )}
          {/* Main Info */}
          <div className="card space-y-8">
            <div className="flex items-center gap-3 border-b border-primary pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base text-primary uppercase">Thông tin căn bản</h3>
                <p className="text-xs text-secondary">Chọn toà nhà và vị trí phòng</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 pb-4">
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Thuộc tòa nhà *</label>
                <div className="relative">
                  <select 
                    name="buildingId"
                    value={formData.buildingId}
                    onChange={handleChange}
                    required
                    className="input input-with-icon h-11"
                  >
                    <option value="">Chọn tòa nhà...</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest flex items-center justify-between">
                  Loại phòng *
                  {buildingDetails?.roomTypePresets?.length > 0 && (
                    <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 uppercase bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800"><Sparkles size={10} /> Có mẫu sẵn</span>
                  )}
                </label>
                <div className="relative">
                  <select 
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleRoomTypeChange}
                    className="input input-with-icon h-11"
                  >
                    <option value="">Chọn loại...</option>
                    {buildingDetails?.roomTypePresets?.map((p: RoomTypePreset) => (
                      <option key={p.type} value={p.type}>{p.type}</option>
                    )) || (
                      <>
                        <option value="Studio">Studio (Khép kín)</option>
                        <option value="1PN">1 Phòng ngủ</option>
                        <option value="2PN">2 Phòng ngủ</option>
                        <option value="Duplex">Duplex (Gác lửng)</option>
                        <option value="Phòng trọ">Phòng trọ</option>
                      </>
                    )}
                  </select>
                  <Wrench size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Số phòng / Tên phòng *</label>
                <div className="relative">
                  <input 
                    type="text" name="name" required value={formData.name} onChange={handleChange}
                    className="input input-with-icon h-11 uppercase"
                    placeholder="Ví dụ: 101, 202..."
                  />
                  <Home size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Vị trí tầng *</label>
                {buildingDetails?.floorCount ? (
                  <div className="relative">
                    <select 
                      name="floor" 
                      required 
                      value={formData.floor} 
                      onChange={handleChange}
                      className="input input-with-icon h-11"
                    >
                      <option value="">Chọn tầng...</option>
                      {Array.from({ length: buildingDetails.floorCount }, (_, i) => i + 1).map(f => (
                        <option key={f} value={f}>Tầng {f}</option>
                      ))}
                    </select>
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary text-xs font-bold uppercase tracking-widest">F</div>
                  </div>
                ) : (
                  <input 
                    type="number" name="floor" required value={formData.floor} onChange={handleChange}
                    className="input h-11"
                    placeholder="Nhập số tầng..."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="card space-y-8">
            <div className="flex items-center gap-3 border-b border-primary pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                <DollarSign size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base text-primary uppercase">Tài chính & Diện tích</h3>
                <p className="text-xs text-secondary">Cấu hình giá và thông số kỹ thuật</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Giá thuê (VNĐ/Tháng) *</label>
                <div className="relative">
                  <input 
                    type="number" name="price" required value={formData.price} onChange={handleChange}
                    className="input input-with-icon h-11 text-blue-600 dark:text-blue-400"
                  />
                  <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Diện tích (m²) *</label>
                <div className="relative">
                  <input 
                    type="number" name="area" required value={formData.area} onChange={handleChange}
                    className="input input-with-icon h-11"
                  />
                  <Ruler size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Số người ở tối đa</label>
                <div className="relative">
                  <input 
                    type="number" name="maxPeople" required value={formData.maxPeople} onChange={handleChange}
                    className="input input-with-icon h-11"
                  />
                  <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Mô tả phòng</label>
              <textarea 
                name="description" value={formData.description} onChange={handleChange} rows={4}
                className="input py-3 min-h-[120px]"
                placeholder="Mô tả các đặc điểm nổi bật: ánh sáng, nội thất, view..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="card bg-primary border-primary p-6 space-y-6">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center border border-amber-100 dark:border-amber-800">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-base text-primary uppercase">Tiện ích đi kèm</h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {availableAmenityOptions.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAmenityChange(item, !formData.amenities.includes(item))}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    formData.amenities.includes(item)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                      : 'bg-tertiary/10 text-secondary border-primary hover:border-blue-200'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors ${
                    formData.amenities.includes(item) ? 'bg-white border-transparent' : 'bg-primary border-primary'
                  }`}>
                    {formData.amenities.includes(item) && <CheckCircle size={10} className="text-blue-600" />}
                  </div>
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-6">
             <div className="flex items-center gap-3 border-b border-primary pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                    <AlertCircle size={20} />
                </div>
                <h3 className="font-bold text-base text-primary uppercase">Trạng thái</h3>
             </div>
             
             <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-tertiary uppercase tracking-widest">Trạng thái hiện tại</label>
                <select 
                  name="status" value={formData.status} onChange={handleChange}
                  className="input h-11"
                >
                  <option value="AVAILABLE">Phòng trống</option>
                  <option value="MAINTENANCE">Đang bảo trì</option>
                  <option value="RENTED">Đã cho thuê</option>
                </select>
             </div>

             <div className="pt-4 border-t border-primary/50">
               <button type="button" className="w-full h-11 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/30">
                 <Trash2 size={16} /> Xóa phòng vĩnh viễn
               </button>
             </div>
          </div>
        </div>
      </form>
    </div>
  )
}
