// prisma/seed.ts - Seed data với 7 toà nhà tại Hà Nội
import { PrismaClient, RoomStatus, InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

// ============================================
// 7 TOÀ NHÀ TẠI HÀ NỘI - MỖI TOÀ CÓ GIÁ KHÁC NHAU
// ============================================
const buildingsData = [
  {
    id: 1,
    name: 'Tòa nhà Zenity Nguyễn Trãi',
    address: '156 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội',
    buildingType: 'CĂN_HỘ',
    floorCount: 5,
    area: 520,
    // Giá cao cấp - khu vực trung tâm Thanh Xuân
    electricityPrice: 3600,
    waterPrice: 26000,
    servicePrice: 60000,
    description: 'Căn hộ cao cấp, gần đại học Quốc gia, tiện di chuyển',
    rooms: [
      // Tầng 1 (5 phòng)
      { name: 'P.101', floor: 1, roomType: 'Studio', price: 4800000, area: 28, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.102', floor: 1, roomType: '1N1K', price: 6800000, area: 45, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.103', floor: 1, roomType: '1N1K', price: 7000000, area: 48, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.104', floor: 1, roomType: 'Studio', price: 4500000, area: 25, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.105', floor: 1, roomType: '1N1K', price: 6500000, area: 42, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      // Tầng 2 (5 phòng)
      { name: 'P.201', floor: 2, roomType: '1N1K', price: 7000000, area: 45, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.202', floor: 2, roomType: '2N1K', price: 9000000, area: 65, maxPeople: 4, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
      { name: 'P.203', floor: 2, roomType: 'Studio', price: 4800000, area: 28, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.204', floor: 2, roomType: '1N1K', price: 6800000, area: 45, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.205', floor: 2, roomType: '1N1K', price: 7200000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt', 'Ban công'] },
      // Tầng 3 (5 phòng)
      { name: 'P.301', floor: 3, roomType: '2N1K', price: 9500000, area: 68, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.302', floor: 3, roomType: '1N1K', price: 7200000, area: 48, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.303', floor: 3, roomType: 'Studio', price: 5000000, area: 30, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Ban công'] },
      { name: 'P.304', floor: 3, roomType: '1N1K', price: 7500000, area: 52, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.305', floor: 3, roomType: '2N1K', price: 8800000, area: 62, maxPeople: 4, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
    ]
  },
  {
    id: 2,
    name: 'Biệt thự Lavender Cầu Giấy',
    address: '89 Xuân Thủy, Quận Cầu Giấy, Hà Nội',
    buildingType: 'BIỆT_THỰ',
    floorCount: 4,
    area: 380,
    // Giá biệt thự cao cấp
    electricityPrice: 3900,
    waterPrice: 30000,
    servicePrice: 100000,
    description: 'Biệt thự yên tĩnh, gần công viên Thủ Lệ, trường học quốc tế',
    rooms: [
      // Tầng 1 (4 phòng)
      { name: 'P.101', floor: 1, roomType: 'Studio', price: 6000000, area: 35, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Sân vườn'] },
      { name: 'P.102', floor: 1, roomType: '1N1K', price: 8000000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt', 'Sân vườn'] },
      { name: 'P.103', floor: 1, roomType: 'Studio', price: 5500000, area: 32, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.104', floor: 1, roomType: '1N1K', price: 7500000, area: 48, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      // Tầng 2 (4 phòng)
      { name: 'P.201', floor: 2, roomType: '1N1K', price: 8500000, area: 52, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.202', floor: 2, roomType: '2N1K', price: 11000000, area: 75, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.203', floor: 2, roomType: '1N1K', price: 7800000, area: 45, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.204', floor: 2, roomType: '2N1K', price: 10500000, area: 70, maxPeople: 4, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
      // Tầng 3 (4 phòng)
      { name: 'P.301', floor: 3, roomType: '2N1K', price: 11500000, area: 78, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.302', floor: 3, roomType: '1N1K', price: 8800000, area: 55, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.303', floor: 3, roomType: '3N1K', price: 14000000, area: 95, maxPeople: 6, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.304', floor: 3, roomType: '1N1K', price: 8200000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
    ]
  },
  {
    id: 3,
    name: 'Nhà phố Hoàng Mai',
    address: '234 Đại Từ, Quận Hoàng Mai, Hà Nội',
    buildingType: 'NHÀ_PHỐ',
    floorCount: 5,
    area: 200,
    // Giá trung bình - khu vực ngoại thành
    electricityPrice: 3200,
    waterPrice: 22000,
    servicePrice: 40000,
    description: 'Nhà phố khu vực Hoàng Mai, gần chợ Đại Từ, tiện mua sắm',
    rooms: [
      // Tầng 1 (4 phòng)
      { name: 'P.101', floor: 1, roomType: 'Studio', price: 3000000, area: 20, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.102', floor: 1, roomType: 'Studio', price: 3200000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      { name: 'P.103', floor: 1, roomType: '1N1K', price: 4200000, area: 35, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.104', floor: 1, roomType: '1N1K', price: 4500000, area: 38, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      // Tầng 2 (4 phòng)
      { name: 'P.201', floor: 2, roomType: '1N1K', price: 4500000, area: 38, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.202', floor: 2, roomType: '1N1K', price: 4800000, area: 40, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.203', floor: 2, roomType: '2N1K', price: 5500000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa'] },
      { name: 'P.204', floor: 2, roomType: 'Studio', price: 3500000, area: 24, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      // Tầng 3 (4 phòng)
      { name: 'P.301', floor: 3, roomType: '1N1K', price: 5000000, area: 42, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.302', floor: 3, roomType: '2N1K', price: 5800000, area: 55, maxPeople: 4, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
      { name: 'P.303', floor: 3, roomType: 'Studio', price: 3600000, area: 25, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      { name: 'P.304', floor: 3, roomType: '1N1K', price: 5200000, area: 45, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      // Tầng 4 (3 phòng)
      { name: 'P.401', floor: 4, roomType: '2N1K', price: 6000000, area: 58, maxPeople: 4, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
      { name: 'P.402', floor: 4, roomType: '1N1K', price: 5400000, area: 48, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.403', floor: 4, roomType: '3N1K', price: 7200000, area: 75, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Giường đơn', 'Sofa', 'Máy giặt'] },
    ]
  },
  {
    id: 4,
    name: 'Phòng trọ Long Biên',
    address: '567 Nguyễn Văn Cừ, Quận Long Biên, Hà Nội',
    buildingType: 'PHÒNG_TRỌ',
    floorCount: 4,
    area: 280,
    // Giá thấp - phòng trọ giá rẻ
    electricityPrice: 3000,
    waterPrice: 20000,
    servicePrice: 30000,
    description: 'Phòng trọ giá rẻ, an ninh tốt, gần bến xe Long Biên',
    rooms: [
      // Tầng 1 (4 phòng)
      { name: 'P.101', floor: 1, roomType: 'Studio', price: 2200000, area: 18, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.102', floor: 1, roomType: 'Studio', price: 2400000, area: 20, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.103', floor: 1, roomType: 'Studio', price: 2500000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      { name: 'P.104', floor: 1, roomType: '1N1K', price: 3200000, area: 28, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Sofa'] },
      // Tầng 2 (4 phòng)
      { name: 'P.201', floor: 2, roomType: 'Studio', price: 2300000, area: 18, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.202', floor: 2, roomType: 'Studio', price: 2500000, area: 20, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.203', floor: 2, roomType: 'Studio', price: 2600000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      { name: 'P.204', floor: 2, roomType: '1N1K', price: 3400000, area: 30, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Sofa', 'Tủ lạnh nhỏ'] },
      // Tầng 3 (4 phòng)
      { name: 'P.301', floor: 3, roomType: 'Studio', price: 2400000, area: 18, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.302', floor: 3, roomType: 'Studio', price: 2600000, area: 20, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.303', floor: 3, roomType: '1N1K', price: 3500000, area: 32, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Sofa', 'Tủ lạnh nhỏ'] },
      { name: 'P.304', floor: 3, roomType: 'Studio', price: 2700000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      // Tầng 4 (3 phòng)
      { name: 'P.401', floor: 4, roomType: 'Studio', price: 2500000, area: 18, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.402', floor: 4, roomType: '1N1K', price: 3600000, area: 35, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.403', floor: 4, roomType: 'Studio', price: 2800000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
    ]
  },
  {
    id: 5,
    name: 'Căn hộ Mỹ Đình',
    address: '123 Đường Lê Đức Thọ, Quận Nam Từ Liêm, Hà Nội',
    buildingType: 'CĂN_HỘ',
    floorCount: 6,
    area: 600,
    // Giá cao cấp khu Mỹ Đình
    electricityPrice: 3700,
    waterPrice: 27000,
    servicePrice: 70000,
    description: 'Căn hộ gần sân vận động Mỹ Đình, khu vực phát triển',
    rooms: [
      // Tầng 1-2 (8 phòng)
      { name: 'P.101', floor: 1, roomType: 'Studio', price: 5200000, area: 30, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.102', floor: 1, roomType: '1N1K', price: 7200000, area: 48, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.103', floor: 1, roomType: 'Studio', price: 4800000, area: 28, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.104', floor: 1, roomType: '1N1K', price: 6800000, area: 45, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.201', floor: 2, roomType: '1N1K', price: 7500000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.202', floor: 2, roomType: '2N1K', price: 9500000, area: 68, maxPeople: 4, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
      { name: 'P.203', floor: 2, roomType: 'Studio', price: 5000000, area: 28, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.204', floor: 2, roomType: '1N1K', price: 7000000, area: 45, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      // Tầng 3-4 (8 phòng)
      { name: 'P.301', floor: 3, roomType: '2N1K', price: 10000000, area: 72, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.302', floor: 3, roomType: '1N1K', price: 7800000, area: 52, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.303', floor: 3, roomType: 'Studio', price: 5200000, area: 30, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Ban công'] },
      { name: 'P.304', floor: 3, roomType: '1N1K', price: 7300000, area: 48, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.401', floor: 4, roomType: '2N1K', price: 10500000, area: 75, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.402', floor: 4, roomType: '1N1K', price: 8000000, area: 55, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.403', floor: 4, roomType: 'Studio', price: 5400000, area: 32, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.404', floor: 4, roomType: '1N1K', price: 7500000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
    ]
  },
  {
    id: 6,
    name: 'Nhà trọ Hai Bà Trưng',
    address: '88 Lò Đúc, Quận Hai Bà Trưng, Hà Nội',
    buildingType: 'PHÒNG_TRỌ',
    floorCount: 5,
    area: 220,
    // Giá trung bình - khu vực nội thành
    electricityPrice: 3100,
    waterPrice: 21000,
    servicePrice: 35000,
    description: 'Phòng trọ khu vực Hai Bà Trưng, gần bến xe Giáp Bát',
    rooms: [
      // Tầng 1 (4 phòng)
      { name: 'P.101', floor: 1, roomType: 'Studio', price: 2600000, area: 20, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.102', floor: 1, roomType: 'Studio', price: 2800000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      { name: 'P.103', floor: 1, roomType: '1N1K', price: 3800000, area: 32, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.104', floor: 1, roomType: 'Studio', price: 2500000, area: 18, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      // Tầng 2-3 (8 phòng)
      { name: 'P.201', floor: 2, roomType: 'Studio', price: 2700000, area: 20, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.202', floor: 2, roomType: 'Studio', price: 2900000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      { name: 'P.203', floor: 2, roomType: '1N1K', price: 4000000, area: 35, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Sofa', 'Tủ lạnh nhỏ'] },
      { name: 'P.204', floor: 2, roomType: 'Studio', price: 2800000, area: 20, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.301', floor: 3, roomType: 'Studio', price: 2800000, area: 20, maxPeople: 1, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đơn'] },
      { name: 'P.302', floor: 3, roomType: 'Studio', price: 3000000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      { name: 'P.303', floor: 3, roomType: '1N1K', price: 4200000, area: 38, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.304', floor: 3, roomType: 'Studio', price: 2900000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      // Tầng 4 (3 phòng)
      { name: 'P.401', floor: 4, roomType: '1N1K', price: 4500000, area: 40, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.402', floor: 4, roomType: 'Studio', price: 3000000, area: 22, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi'] },
      { name: 'P.403', floor: 4, roomType: '2N1K', price: 5200000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Giường đôi', 'Giường đơn', 'Sofa'] },
    ]
  },
  {
    id: 7,
    name: 'Căn hộ Times City',
    address: '456 Minh Khai, Quận Hai Bà Trưng, Hà Nội',
    buildingType: 'CĂN_HỘ',
    floorCount: 7,
    area: 750,
    // Giá cao cấp Times City
    electricityPrice: 3800,
    waterPrice: 28000,
    servicePrice: 85000,
    description: 'Căn hộ cao cấp khu đô thị Times City, tiện ích đầy đủ',
    rooms: [
      // Tầng 1-2 (10 phòng)
      { name: 'P.101', floor: 1, roomType: 'Studio', price: 5800000, area: 32, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.102', floor: 1, roomType: '1N1K', price: 8000000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.103', floor: 1, roomType: 'Studio', price: 5500000, area: 30, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.104', floor: 1, roomType: '1N1K', price: 7500000, area: 48, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.105', floor: 1, roomType: '2N1K', price: 10000000, area: 70, maxPeople: 4, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
      { name: 'P.201', floor: 2, roomType: '1N1K', price: 8200000, area: 52, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.202', floor: 2, roomType: '2N1K', price: 10500000, area: 72, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
      { name: 'P.203', floor: 2, roomType: 'Studio', price: 6000000, area: 32, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.204', floor: 2, roomType: '1N1K', price: 7800000, area: 50, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa'] },
      { name: 'P.205', floor: 2, roomType: 'Studio', price: 5600000, area: 30, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      // Tầng 3-4 (10 phòng)
      { name: 'P.301', floor: 3, roomType: '2N1K', price: 11000000, area: 75, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.302', floor: 3, roomType: '1N1K', price: 8500000, area: 55, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.303', floor: 3, roomType: 'Studio', price: 6200000, area: 34, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Ban công'] },
      { name: 'P.304', floor: 3, roomType: '1N1K', price: 8000000, area: 52, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
      { name: 'P.305', floor: 3, roomType: '2N1K', price: 10800000, area: 72, maxPeople: 4, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt'] },
      { name: 'P.401', floor: 4, roomType: '2N1K', price: 11500000, area: 78, maxPeople: 5, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.402', floor: 4, roomType: '1N1K', price: 8800000, area: 58, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.403', floor: 4, roomType: '3N1K', price: 15000000, area: 95, maxPeople: 6, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Giường đơn', 'Giường đơn', 'Sofa', 'Máy giặt', 'Ban công'] },
      { name: 'P.404', floor: 4, roomType: 'Studio', price: 6500000, area: 35, maxPeople: 2, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi'] },
      { name: 'P.405', floor: 4, roomType: '1N1K', price: 8200000, area: 52, maxPeople: 3, amenities: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Giường đôi', 'Sofa', 'Máy giặt'] },
    ]
  }
]

// ============================================
// DỊCH VỤ
// ============================================
const services = [
  { name: 'Điện', unitPrice: 3500, unit: 'kWh' },
  { name: 'Nước', unitPrice: 25000, unit: 'm3' },
  { name: 'Dịch vụ chung', unitPrice: 50000, unit: 'Phòng' },
  { name: 'Giặt ủi', unitPrice: 25000, unit: 'Kg' },
  { name: 'Dọn phòng', unitPrice: 100000, unit: 'Lần' },
  { name: 'Vệ sinh máy lạnh', unitPrice: 250000, unit: 'Lần' },
]

// ============================================
// HÀM TÍNH ĐIỆN NƯỚC THEO THÁNG VÀ LOẠI HỘ
// ============================================
function getMonthlyUsage(roomTypeStr: string, month: number, hasFamily: boolean): [number, number] {
  // Mùa nóng (5-9): điện cao hơn, mùa lạnh (11-2): điện thấp hơn
  const isHotSeason = month >= 5 && month <= 9
  const isColdSeason = month >= 11 || month <= 2

  // Cơ bản theo loại phòng
  let base = roomTypeStr === 'Studio' ? { elec: 60, water: 2.5 }
    : roomTypeStr === '1N1K' ? { elec: 100, water: 5 }
      : roomTypeStr === '2N1K' ? { elec: 150, water: 7 }
        : { elec: 200, water: 10 }

  // Hộ gia đình sử dụng nhiều hơn
  if (hasFamily) {
    base.elec *= 1.5
    base.water *= 1.4
  }

  let elecVariation = Math.floor(Math.random() * 20) - 8
  let waterVariation = Math.floor(Math.random() * 2) - 1

  let multiplier = 1.0
  if (isHotSeason) multiplier = 1.35
  else if (isColdSeason) multiplier = 0.9

  return [
    Math.round((base.elec + elecVariation) * multiplier),
    Math.max(2, (base.water + waterVariation))
  ]
}

async function main() {
  console.log('🔄 Bắt đầu tạo dữ liệu mẫu với 7 toà nhà tại Hà Nội...')

  // 1. Tạo Admin
  const hashedAdmin = await hashPassword('admin')
  const admin = await prisma.user.upsert({
    where: { phone: '0963304396' },
    update: {},
    create: {
      phone: '0963304396', password: hashedAdmin, fullName: 'Quản Trị Viên',
      role: 'ADMIN', isActive: true, isFirstLogin: false,
      email: 'admin@ezhome.vn', gender: 'NAM',
    },
  })
  console.log('✅ Admin:', admin.phone)

  // 2. Tạo 7 Buildings
  console.log('📦 Tạo 7 toà nhà tại Hà Nội...')
  const buildings = []
  for (const b of buildingsData) {
    const building = await prisma.building.create({
      data: {
        name: b.name,
        address: b.address,
        buildingType: b.buildingType,
        floorCount: b.floorCount,
        area: b.area,
        electricityPrice: b.electricityPrice,
        waterPrice: b.waterPrice,
        servicePrice: b.servicePrice,
        description: b.description,
        status: 'ACTIVE',
        totalRooms: b.rooms.length,
      }
    })
    buildings.push({ ...building, rooms: b.rooms, electricityPrice: b.electricityPrice, waterPrice: b.waterPrice, servicePrice: b.servicePrice })
    console.log(`   ✅ ${building.name} - ${b.rooms.length} phòng`)
  }

  // 3. Tạo Rooms
  console.log('📦 Tạo phòng...')
  const allRooms: any[] = []
  for (const building of buildings) {
    for (const roomData of building.rooms) {
      const room = await prisma.room.create({
        data: {
          buildingId: building.id,
          name: roomData.name,
          floor: roomData.floor,
          price: roomData.price,
          area: roomData.area,
          maxPeople: roomData.maxPeople,
          roomType: roomData.roomType,
          status: RoomStatus.AVAILABLE,
          amenities: roomData.amenities,
        }
      })
      allRooms.push({ ...room, buildingId: building.id, electricityPrice: building.electricityPrice, waterPrice: building.waterPrice, servicePrice: building.servicePrice })
    }
  }
  console.log(`✅ Tổng ${allRooms.length} phòng`)

  // 4. Tạo Services
  await prisma.service.createMany({ data: services.map(s => ({ ...s })), skipDuplicates: true })
  console.log(`✅ ${services.length} dịch vụ`)

  // 5. Tạo cư dân và hợp đồng (chỉ thuê ~70% phòng)
  console.log('📦 Tạo cư dân và hợp đồng...')
  const hashedTenant = await hashPassword('123456')
  const tenantUsers: any[] = []
  const contracts: any[] = []

  // Các tháng: 9/2025 -> 4/2026 (8 tháng)
  const months = [
    { m: 9, y: 2025 }, { m: 10, y: 2025 }, { m: 11, y: 2025 }, { m: 12, y: 2025 },
    { m: 1, y: 2026 }, { m: 2, y: 2026 }, { m: 3, y: 2026 }, { m: 4, y: 2026 }
  ]

  // Danh sách cư dân với thông tin chi tiết
  const tenantsInfo = [
    // Building 1 - Zenity (12 tenants)
    { buildingIdx: 0, roomIdx: 0, phone: '0981001001', fullName: 'Nguyễn Văn Minh', hasFamily: false, contractMonth: 12 },
    { buildingIdx: 0, roomIdx: 1, phone: '0981001002', fullName: 'Lê Thị Hương', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 0, roomIdx: 2, phone: '0981001003', fullName: 'Phạm Đình Phong', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 0, roomIdx: 3, phone: '0981001004', fullName: 'Hoàng Thị Mai', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 0, roomIdx: 4, phone: '0981001005', fullName: 'Vũ Đình Tuấn', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 0, roomIdx: 5, phone: '0981001006', fullName: 'Đặng Thị Thủy', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 0, roomIdx: 6, phone: '0981001007', fullName: 'Bùi Văn Nam', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 0, roomIdx: 7, phone: '0981001008', fullName: 'Ngô Thị Phương', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 0, roomIdx: 8, phone: '0981001009', fullName: 'Trần Văn Bắc', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 0, roomIdx: 9, phone: '0981001010', fullName: 'Phạm Thị Hằng', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 0, roomIdx: 10, phone: '0981001011', fullName: 'Nguyễn Hoàng Long', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 0, roomIdx: 11, phone: '0981001012', fullName: 'Lý Thị Hồng', hasFamily: false, contractMonth: 3 },
    // Building 2 - Lavender (10 tenants)
    { buildingIdx: 1, roomIdx: 0, phone: '0982002001', fullName: 'Võ Văn Minh', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 1, roomIdx: 1, phone: '0982002002', fullName: 'Đỗ Văn Hùng', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 1, roomIdx: 2, phone: '0982002003', fullName: 'Trịnh Thị Yến', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 1, roomIdx: 3, phone: '0982002004', fullName: 'Lưu Văn Quang', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 1, roomIdx: 4, phone: '0982002005', fullName: 'Phan Thị Thu', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 1, roomIdx: 5, phone: '0982002006', fullName: 'Hồ Văn Đức', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 1, roomIdx: 6, phone: '0982002007', fullName: 'Nguyễn Thị Hương', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 1, roomIdx: 7, phone: '0982002008', fullName: 'Bùi Văn Đức', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 1, roomIdx: 8, phone: '0982002009', fullName: 'Lê Thị Nga', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 1, roomIdx: 9, phone: '0982002010', fullName: 'Nguyễn Văn Sơn', hasFamily: true, contractMonth: 12 },
    // Building 3 - Hoàng Mai (12 tenants)
    { buildingIdx: 2, roomIdx: 0, phone: '0983003001', fullName: 'Trần Văn Thắng', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 2, roomIdx: 1, phone: '0983003002', fullName: 'Hoàng Thị Hạnh', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 2, roomIdx: 2, phone: '0983003003', fullName: 'Vũ Thị Hồng', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 2, roomIdx: 3, phone: '0983003004', fullName: 'Đặng Văn Nam', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 2, roomIdx: 4, phone: '0983003005', fullName: 'Lê Thị Lan', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 2, roomIdx: 5, phone: '0983003006', fullName: 'Phạm Văn Hùng', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 2, roomIdx: 6, phone: '0983003007', fullName: 'Nguyễn Thị Mai', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 2, roomIdx: 7, phone: '0983003008', fullName: 'Trần Đình Tuấn', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 2, roomIdx: 8, phone: '0983003009', fullName: 'Lý Thị Yến', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 2, roomIdx: 9, phone: '0983003010', fullName: 'Võ Thị Thu', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 2, roomIdx: 10, phone: '0983003011', fullName: 'Bùi Văn Minh', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 2, roomIdx: 11, phone: '0983003012', fullName: 'Hoàng Thị Lan', hasFamily: true, contractMonth: 12 },
    // Building 4 - Long Biên (12 tenants)
    { buildingIdx: 3, roomIdx: 0, phone: '0984004001', fullName: 'Đỗ Thị Hương', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 3, roomIdx: 1, phone: '0984004002', fullName: 'Nguyễn Văn Bảo', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 3, roomIdx: 2, phone: '0984004003', fullName: 'Trần Thị Nga', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 3, roomIdx: 3, phone: '0984004004', fullName: 'Lê Văn Nam', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 3, roomIdx: 4, phone: '0984004005', fullName: 'Phạm Thị Lan', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 3, roomIdx: 5, phone: '0984004006', fullName: 'Hoàng Văn Đức', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 3, roomIdx: 6, phone: '0984004007', fullName: 'Vũ Thị Mai', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 3, roomIdx: 7, phone: '0984004008', fullName: 'Ngô Văn Hùng', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 3, roomIdx: 8, phone: '0984004009', fullName: 'Đặng Thị Yến', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 3, roomIdx: 9, phone: '0984004010', fullName: 'Lý Văn Sơn', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 3, roomIdx: 10, phone: '0984004011', fullName: 'Trịnh Thị Thu', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 3, roomIdx: 11, phone: '0984004012', fullName: 'Hồ Thị Hà', hasFamily: false, contractMonth: 3 },
    // Building 5 - Mỹ Đình (14 tenants)
    { buildingIdx: 4, roomIdx: 0, phone: '0985005001', fullName: 'Nguyễn Thị Hòa', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 4, roomIdx: 1, phone: '0985005002', fullName: 'Trần Văn Minh', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 4, roomIdx: 2, phone: '0985005003', fullName: 'Lê Thị Hà', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 4, roomIdx: 3, phone: '0985005004', fullName: 'Phạm Văn Đạt', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 4, roomIdx: 4, phone: '0985005005', fullName: 'Hoàng Thị Ngọc', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 4, roomIdx: 5, phone: '0985005006', fullName: 'Vũ Văn Tuấn', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 4, roomIdx: 6, phone: '0985005007', fullName: 'Đặng Thị Phương', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 4, roomIdx: 7, phone: '0985005008', fullName: 'Nguyễn Văn Bắc', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 4, roomIdx: 8, phone: '0985005009', fullName: 'Trần Thị Yến', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 4, roomIdx: 9, phone: '0985005010', fullName: 'Lý Văn Nam', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 4, roomIdx: 10, phone: '0985005011', fullName: 'Võ Thị Lan', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 4, roomIdx: 11, phone: '0985005012', fullName: 'Bùi Văn Hùng', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 4, roomIdx: 12, phone: '0985005013', fullName: 'Hoàng Thị Hương', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 4, roomIdx: 13, phone: '0985005014', fullName: 'Ngô Văn Minh', hasFamily: true, contractMonth: 12 },
    // Building 6 - Hai Bà Trưng (12 tenants)
    { buildingIdx: 5, roomIdx: 0, phone: '0986006001', fullName: 'Đỗ Văn Bảo', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 5, roomIdx: 1, phone: '0986006002', fullName: 'Nguyễn Thị Nga', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 5, roomIdx: 2, phone: '0986006003', fullName: 'Trần Văn Hòa', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 5, roomIdx: 3, phone: '0986006004', fullName: 'Lê Thị Thu', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 5, roomIdx: 4, phone: '0986006005', fullName: 'Phạm Văn Nam', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 5, roomIdx: 5, phone: '0986006006', fullName: 'Hoàng Văn Đức', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 5, roomIdx: 6, phone: '0986006007', fullName: 'Vũ Thị Mai', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 5, roomIdx: 7, phone: '0986006008', fullName: 'Nguyễn Văn Sơn', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 5, roomIdx: 8, phone: '0986006009', fullName: 'Đặng Thị Hà', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 5, roomIdx: 9, phone: '0986006010', fullName: 'Lý Văn Hùng', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 5, roomIdx: 10, phone: '0986006011', fullName: 'Trịnh Văn Bắc', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 5, roomIdx: 11, phone: '0986006012', fullName: 'Hồ Thị Lan', hasFamily: false, contractMonth: 3 },
    // Building 7 - Times City (16 tenants)
    { buildingIdx: 6, roomIdx: 0, phone: '0987007001', fullName: 'Nguyễn Thị Yến', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 6, roomIdx: 1, phone: '0987007002', fullName: 'Trần Văn Minh', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 6, roomIdx: 2, phone: '0987007003', fullName: 'Lê Thị Hương', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 6, roomIdx: 3, phone: '0987007004', fullName: 'Phạm Văn Hùng', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 6, roomIdx: 4, phone: '0987007005', fullName: 'Hoàng Thị Thu', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 6, roomIdx: 5, phone: '0987007006', fullName: 'Vũ Văn Nam', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 6, roomIdx: 6, phone: '0987007007', fullName: 'Đặng Thị Mai', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 6, roomIdx: 7, phone: '0987007008', fullName: 'Nguyễn Văn Đức', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 6, roomIdx: 8, phone: '0987007009', fullName: 'Trần Thị Nga', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 6, roomIdx: 9, phone: '0987007010', fullName: 'Lý Văn Tuấn', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 6, roomIdx: 10, phone: '0987007011', fullName: 'Võ Thị Yến', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 6, roomIdx: 11, phone: '0987007012', fullName: 'Bùi Văn Sơn', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 6, roomIdx: 12, phone: '0987007013', fullName: 'Hoàng Thị Lan', hasFamily: false, contractMonth: 3 },
    { buildingIdx: 6, roomIdx: 13, phone: '0987007014', fullName: 'Ngô Văn Hòa', hasFamily: true, contractMonth: 12 },
    { buildingIdx: 6, roomIdx: 14, phone: '0987007015', fullName: 'Đỗ Thị Hà', hasFamily: false, contractMonth: 6 },
    { buildingIdx: 6, roomIdx: 15, phone: '0987007016', fullName: 'Lê Văn Bảo', hasFamily: false, contractMonth: 3 },
  ]

  let contractIndex = 0
  for (const tenant of tenantsInfo) {
    const building = buildings[tenant.buildingIdx]
    const room = allRooms.find(r => r.buildingId === building.id && r.name === building.rooms[tenant.roomIdx].name)

    // Tạo user
    const user = await prisma.user.upsert({
      where: { phone: tenant.phone },
      update: {},
      create: {
        phone: tenant.phone,
        password: hashedTenant,
        fullName: tenant.fullName,
        email: `${tenant.phone}@gmail.com`,
        role: 'TENANT',
        isActive: true,
        isFirstLogin: false,
        gender: 'NAM',
      }
    })
    tenantUsers.push(user)

    // Update room status to RENTED
    await prisma.room.update({
      where: { id: room.id },
      data: { status: RoomStatus.RENTED }
    })

    // Tạo hợp đồng
    const startDate = new Date('2025-09-01')
    const endDate = new Date('2025-09-01')
    endDate.setMonth(endDate.getMonth() + tenant.contractMonth)
    const roomPrice = Number(room.price)

    const contract = await prisma.contract.create({
      data: {
        userId: user.id,
        roomId: room.id,
        startDate,
        endDate,
        deposit: roomPrice * 2,
        rentPrice: roomPrice,
        status: 'ACTIVE',
      }
    })
    contracts.push(contract)

    // Tạo chỉ số điện nước và hoá đơn cho từng tháng (từ 9/2025 đến 4/2026)
    let elecCumulative = Math.floor(Math.random() * 50) + 50 // Bắt đầu với chỉ số cũ
    let waterCumulative = Math.floor(Math.random() * 10) + 5

    for (let mi = 0; mi < months.length; mi++) {
      const { m, y } = months[mi]
      const [elecUsage, waterUsage] = getMonthlyUsage(room.roomType, m, tenant.hasFamily)
      const elecOld = elecCumulative
      elecCumulative += elecUsage
      const waterOld = waterCumulative
      waterCumulative += waterUsage

      const elecPrice = room.electricityPrice
      const waterPrice = room.waterPrice
      const servicePrice = room.servicePrice

      await prisma.meterReading.create({
        data: {
          roomId: room.id,
          month: m,
          year: y,
          elecOld,
          elecNew: elecCumulative,
          waterOld,
          waterNew: waterCumulative,
          recordedDate: new Date(y, m - 1, 28),
        }
      })

      // Tính hoá đơn
      const amountElec = elecUsage * elecPrice
      const amountWater = waterUsage * waterPrice
      const amountCommonService = servicePrice
      const totalAmount = roomPrice + amountElec + amountWater + amountCommonService
      // Hạn thanh toán: ngày 25 hàng tháng
      const dueDate = new Date(y, m - 1, 25)

      // Xác định trạng thái hoá đơn
      let status: 'PAID' | 'UNPAID' | 'OVERDUE' = 'PAID'
      let paidAt: Date | null = new Date(y, m - 1, Math.min(20 + Math.floor(Math.random() * 5), 24))

      // Tháng 4/2026 (tháng hiện tại): một số chưa thanh toán hoặc quá hạn
      if (y === 2026 && m === 4) {
        const rand = Math.random()
        if (rand < 0.4) {
          status = 'UNPAID'
          paidAt = null
        } else if (rand < 0.5) {
          status = 'OVERDUE'
          paidAt = null
        }
      }
      // Tháng 3/2026: một số quá hạn
      else if (y === 2026 && m === 3) {
        const rand = Math.random()
        if (rand < 0.2) {
          status = 'OVERDUE'
          paidAt = new Date(y, m - 1, 28) // Thanh toán muộn
        }
      }

      const invoice = await prisma.invoice.create({
        data: {
          contractId: contract.id,
          month: m,
          year: y,
          amountRoom: roomPrice,
          amountElec,
          amountWater,
          amountCommonService,
          amountService: 0,
          totalAmount,
          status,
          paymentDueDate: dueDate,
          paidAt,
          buildingId: room.buildingId,
          buildingName: building.name,
          buildingAddress: building.address,
        }
      })

      // Tạo payment cho hoá đơn đã thanh toán
      if (status === 'PAID' && paidAt) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: totalAmount,
            method: PaymentMethod.VIETQR,
            status: PaymentStatus.SUCCESS,
            paidAt,
          }
        })
      }
    }

    contractIndex++
  }

  console.log(`✅ ${tenantUsers.length} cư dân, ${contracts.length} hợp đồng`)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ HOÀN THÀNH!')
  console.log('='.repeat(60))
  console.log(`   👤 Admin: 0963304396 / admin`)
  console.log(`   🏠 7 Toà nhà tại Hà Nội:`)
  console.log(`      1. Zenity Nguyễn Trãi - ${buildingsData[0].rooms.length} phòng`)
  console.log(`      2. Lavender Cầu Giấy - ${buildingsData[1].rooms.length} phòng`)
  console.log(`      3. Nhà phố Hoàng Mai - ${buildingsData[2].rooms.length} phòng`)
  console.log(`      4. Phòng trọ Long Biên - ${buildingsData[3].rooms.length} phòng`)
  console.log(`      5. Căn hộ Mỹ Đình - ${buildingsData[4].rooms.length} phòng`)
  console.log(`      6. Nhà trọ Hai Bà Trưng - ${buildingsData[5].rooms.length} phòng`)
  console.log(`      7. Căn hộ Times City - ${buildingsData[6].rooms.length} phòng`)
  console.log(`   🏢 ${allRooms.length} Phòng (${tenantsInfo.length} thuê, ${allRooms.length - tenantsInfo.length} trống)`)
  console.log(`   👥 ${tenantsInfo.length} Cư dân`)
  console.log(`   📄 ${tenantsInfo.length * 8} Hoá đơn (9/2025 - 4/2026)`)
  console.log(`      - Đã thanh toán: phần lớn`)
  console.log(`      - Quá hạn: một số tháng 3, 4/2026`)
  console.log(`      - Chưa thanh toán: một số tháng 4/2026`)
  console.log(`   📅 Hạn thanh toán: ngày 25 hàng tháng`)
  console.log(`   📝 Hợp đồng: 3, 6, 12 tháng`)
  console.log(`   🔑 Mật khẩu tenant: 123456`)
  console.log('='.repeat(60))
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
