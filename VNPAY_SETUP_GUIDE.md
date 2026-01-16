# Hướng dẫn cấu hình VNPay chi tiết

## Mục lục
1. [Đăng ký tài khoản VNPay](#1-đăng-ký-tài-khoản-vnpay)
2. [Lấy thông tin Merchant](#2-lấy-thông-tin-merchant)
3. [Cấu hình môi trường](#3-cấu-hình-môi-trường)
4. [Cấu hình trong VNPay Dashboard](#4-cấu-hình-trong-vnpay-dashboard)
5. [Chạy Migration Database](#5-chạy-migration-database)
6. [Test thanh toán](#6-test-thanh-toán)
7. [Chuyển sang Production](#7-chuyển-sang-production)

---

## 1. Đăng ký tài khoản VNPay

### Bước 1: Truy cập website VNPay
- **Sandbox (Test)**: https://sandbox.vnpayment.vn/
- **Production**: https://www.vnpayment.vn/

### Bước 2: Đăng ký tài khoản
1. Click "Đăng ký" hoặc "Đăng nhập"
2. Điền thông tin:
   - Email
   - Số điện thoại
   - Mật khẩu
   - Tên công ty/tổ chức
3. Xác thực email và số điện thoại

### Bước 3: Tạo Merchant Account
1. Sau khi đăng nhập, vào **"Quản lý Merchant"**
2. Click **"Tạo Merchant mới"**
3. Điền thông tin:
   - Tên merchant
   - Mô tả dịch vụ
   - Website
   - Thông tin liên hệ
4. Chờ VNPay duyệt (thường 1-3 ngày làm việc)

---

## 2. Lấy thông tin Merchant

Sau khi merchant được duyệt, bạn sẽ nhận được:

### Thông tin quan trọng:
1. **TMN Code** (Terminal Code)
   - Ví dụ: `2QXUI4J4`
   - Đây là mã định danh merchant của bạn

2. **Hash Secret**
   - Ví dụ: `RAOCTZKRVBMGKEIZALWSWFRMMLZOFJYE`
   - Dùng để tạo và verify chữ ký bảo mật

3. **API URL**
   - **Sandbox**: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
   - **Production**: `https://www.vnpayment.vn/paymentv2/vpcpay.html`

### Cách lấy thông tin:
1. Đăng nhập vào VNPay Dashboard
2. Vào **"Quản lý Merchant"** → Chọn merchant của bạn
3. Vào tab **"Thông tin kết nối"** hoặc **"API Integration"**
4. Copy các thông tin trên

---

## 3. Cấu hình môi trường

### Bước 1: Tạo/Chỉnh sửa file `.env`

Tạo file `.env` trong thư mục gốc của project (nếu chưa có) hoặc thêm các dòng sau:

```env
# ============================================
# VNPay Configuration
# ============================================

# TMN Code từ VNPay Dashboard
VNPAY_TMN_CODE=2QXUI4J4

# Hash Secret từ VNPay Dashboard
VNPAY_HASH_SECRET=RAOCTZKRVBMGKEIZALWSWFRMMLZOFJYE

# URL VNPay (Sandbox cho test, Production cho live)
# Sandbox:
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# Production (uncomment khi deploy):
# VNPAY_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html

# Return URL - URL mà VNPay sẽ redirect về sau khi thanh toán
# Development (localhost):
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback

# Production (uncomment và thay đổi khi deploy):
# VNPAY_RETURN_URL=https://yourdomain.com/api/payments/vnpay-callback
```

### Bước 2: Thay thế giá trị thực tế

**⚠️ QUAN TRỌNG**: Thay thế các giá trị sau bằng thông tin thực tế của bạn:

- `VNPAY_TMN_CODE`: Thay bằng TMN Code từ VNPay
- `VNPAY_HASH_SECRET`: Thay bằng Hash Secret từ VNPay
- `VNPAY_RETURN_URL`: 
  - Development: Giữ nguyên `http://localhost:3000/api/payments/vnpay-callback`
  - Production: Thay `yourdomain.com` bằng domain thực tế

### Bước 3: Bảo mật file `.env`

**KHÔNG BAO GIỜ** commit file `.env` lên Git!

Đảm bảo file `.gitignore` có dòng:
```
.env
.env.local
.env*.local
```

---

## 4. Cấu hình trong VNPay Dashboard

### Bước 1: Cấu hình Return URL

1. Đăng nhập VNPay Dashboard
2. Vào **"Quản lý Merchant"** → Chọn merchant của bạn
3. Vào **"Cấu hình"** hoặc **"Settings"**
4. Tìm mục **"Return URL"** hoặc **"Callback URL"**
5. Thêm URL:
   - **Development**: `http://localhost:3000/api/payments/vnpay-callback`
   - **Production**: `https://yourdomain.com/api/payments/vnpay-callback`

### Bước 2: Cấu hình IP Whitelist (nếu cần)

Một số môi trường production yêu cầu whitelist IP:
1. Vào **"Bảo mật"** hoặc **"Security"**
2. Thêm IP server của bạn vào whitelist
3. Lưu ý: Không cần thiết cho sandbox

### Bước 3: Kiểm tra trạng thái Merchant

Đảm bảo merchant của bạn ở trạng thái **"Hoạt động"** hoặc **"Active"**

---

## 5. Chạy Migration Database

Sau khi cấu hình môi trường, cần tạo bảng `Payment` trong database:

### Bước 1: Tạo migration

```bash
npx prisma migrate dev --name add_payment_model
```

Lệnh này sẽ:
- Tạo file migration mới
- Chạy migration trên database
- Tạo bảng `Payment` và các enum liên quan

### Bước 2: Generate Prisma Client

```bash
npx prisma generate
```

Lệnh này sẽ generate Prisma Client với model `Payment` mới.

### Bước 3: Kiểm tra database

Kiểm tra xem bảng `Payment` đã được tạo chưa:
- Có thể dùng Prisma Studio: `npx prisma studio`
- Hoặc query trực tiếp database

---

## 6. Test thanh toán

### Bước 1: Khởi động server

```bash
npm run dev
```

### Bước 2: Test flow thanh toán

1. **Đăng nhập** vào tenant account
2. Vào trang **"Hóa đơn"** (`/tenant/invoices`)
3. Chọn một hóa đơn chưa thanh toán (status: UNPAID)
4. Click nút **"THANH TOÁN ONLINE QUA VNPAY"**
5. Bạn sẽ được redirect đến trang VNPay Sandbox

### Bước 3: Test với thẻ test

VNPay Sandbox cung cấp thẻ test:

**Thẻ thành công:**
- Số thẻ: `9704198526191432198`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày hết hạn: Bất kỳ ngày trong tương lai (ví dụ: `12/25`)
- CVV: `123`
- OTP: `123456`

**Thẻ thất bại:**
- Số thẻ: `9704198526191432199`
- Các thông tin khác giống trên

### Bước 4: Kiểm tra kết quả

Sau khi thanh toán:
1. VNPay sẽ redirect về `/tenant/invoices?success=true&message=...`
2. Hóa đơn sẽ được cập nhật status = `PAID`
3. Có thể kiểm tra trong database:
   - Bảng `Payment`: Có record mới với status = `SUCCESS`
   - Bảng `Invoice`: Status = `PAID`, `paidAt` được set

---

## 7. Chuyển sang Production

### Bước 1: Cập nhật `.env`

Thay đổi các giá trị sau:

```env
# Chuyển sang Production URL
VNPAY_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html

# Cập nhật Return URL với domain thực tế
VNPAY_RETURN_URL=https://yourdomain.com/api/payments/vnpay-callback
```

### Bước 2: Cập nhật VNPay Dashboard

1. Đăng nhập VNPay Production Dashboard
2. Cập nhật Return URL: `https://yourdomain.com/api/payments/vnpay-callback`
3. Kiểm tra merchant status = Active

### Bước 3: Đảm bảo HTTPS

**⚠️ BẮT BUỘC**: VNPay Production yêu cầu HTTPS
- Cài đặt SSL certificate
- Đảm bảo domain có HTTPS hoạt động

### Bước 4: Test lại trên Production

1. Test với số tiền nhỏ trước
2. Kiểm tra callback hoạt động đúng
3. Verify signature validation
4. Test các trường hợp lỗi

### Bước 5: Monitor và Log

- Monitor payment logs trong VNPay Dashboard
- Log các transaction trong database
- Set up alerts cho failed payments

---

## Troubleshooting

### Lỗi: "Invalid signature"
- **Nguyên nhân**: Hash Secret không đúng
- **Giải pháp**: Kiểm tra lại `VNPAY_HASH_SECRET` trong `.env`

### Lỗi: "Merchant not found"
- **Nguyên nhân**: TMN Code không đúng
- **Giải pháp**: Kiểm tra lại `VNPAY_TMN_CODE` trong `.env`

### Lỗi: "Return URL mismatch"
- **Nguyên nhân**: Return URL không khớp với cấu hình trong VNPay
- **Giải pháp**: 
  - Kiểm tra `VNPAY_RETURN_URL` trong `.env`
  - Kiểm tra Return URL trong VNPay Dashboard
  - Đảm bảo chính xác (bao gồm http/https, port, path)

### Lỗi: "Payment not found" sau callback
- **Nguyên nhân**: Transaction ID không khớp
- **Giải pháp**: Kiểm tra logic tạo `transactionId` trong `/api/payments/create`

### Thanh toán thành công nhưng invoice không cập nhật
- **Nguyên nhân**: Lỗi trong callback handler
- **Giải pháp**: 
  - Kiểm tra logs server
  - Verify signature có đúng không
  - Kiểm tra database transaction

---

## Tài liệu tham khảo

- **VNPay Documentation**: https://sandbox.vnpayment.vn/apis/
- **VNPay Sandbox**: https://sandbox.vnpayment.vn/
- **VNPay Support**: support@vnpayment.vn

---

## Checklist trước khi go-live

- [ ] Đã test toàn bộ flow thanh toán trên Sandbox
- [ ] Đã cấu hình Production credentials
- [ ] Đã cập nhật Return URL trong VNPay Dashboard
- [ ] Đã cài đặt SSL/HTTPS
- [ ] Đã test trên Production với số tiền nhỏ
- [ ] Đã set up monitoring và alerts
- [ ] Đã backup database
- [ ] Đã document quy trình xử lý lỗi

---

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs server (`console.log` trong code)
2. VNPay Dashboard → Transaction logs
3. Database → Bảng `Payment` và `Invoice`
4. Network tab trong browser DevTools
