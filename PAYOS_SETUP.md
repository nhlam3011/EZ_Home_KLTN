# Hướng dẫn cấu hình PayOS

## Tổng quan

PayOS là một nền tảng thanh toán trực tuyến phổ biến tại Việt Nam, cho phép thanh toán qua nhiều phương thức như thẻ ngân hàng, ví điện tử, và QR code.

## Cài đặt

### 1. Cài đặt package

```bash
npm install @payos/node
```

### 2. Cấu hình biến môi trường

Thêm các biến sau vào file `.env`:

```env
# PayOS API Credentials (BẮT BUỘC)
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
```

## Lấy thông tin từ PayOS

1. **Đăng ký tài khoản PayOS:**
   - Truy cập: https://pay.payos.vn/
   - Đăng ký tài khoản merchant

2. **Lấy thông tin API:**
   - Đăng nhập vào PayOS Dashboard
   - Vào mục "Cài đặt" > "API Integration"
   - Copy các thông tin:
     - `Client ID`
     - `API Key`
     - `Checksum Key`

3. **Cấu hình Webhook:**
   - Trong PayOS Dashboard, vào "Webhook"
   - Thêm webhook URL: `https://your-domain.com/api/payments/payos/callback`
   - Chọn các sự kiện: `payment.success`, `payment.failed`

## Cấu trúc thanh toán

### Luồng thanh toán PayOS

```
[Tenant] Chọn "Thanh toán PayOS" trên hóa đơn
  ↓
[Frontend] Gọi API: POST /api/payments/payos/create
  ↓
[Backend] 
  1. Tạo Payment record (status = PENDING)
  2. Gọi PayOS API để tạo payment link
  3. Nhận response: checkoutUrl, qrCode
  4. Lưu vào Payment record
  ↓
[Frontend] Mở checkoutUrl trong tab mới
  ↓
[Tenant] Thanh toán trên trang PayOS
  ↓
[PayOS] Gọi webhook: POST /api/payments/payos/callback
  ↓
[Backend]
  1. Xác thực webhook
  2. Tìm Payment theo orderCode
  3. Cập nhật Payment (status = SUCCESS, paidAt = now)
  4. Cập nhật Invoice (status = PAID, paidAt = now)
  ↓
[Frontend] Auto-refresh → Hiển thị trạng thái "Đã thanh toán"
```

## Sử dụng

### 1. Thanh toán hóa đơn

- Vào trang "Hóa đơn & Thanh toán" (`/tenant/invoices`)
- Chọn hóa đơn chưa thanh toán
- Click nút "Thanh toán PayOS"
- Hệ thống sẽ mở trang thanh toán PayOS trong tab mới
- Hoàn tất thanh toán trên trang PayOS
- Hệ thống sẽ tự động cập nhật trạng thái sau khi thanh toán thành công

### 2. Kiểm tra trạng thái thanh toán

Hệ thống tự động kiểm tra trạng thái thanh toán mỗi 3 giây trong vòng 15 phút sau khi tạo payment link.

## Xử lý lỗi

### Lỗi: "PayOS configuration is incomplete"

**Nguyên nhân:** Thiếu thông tin cấu hình PayOS trong `.env`

**Giải pháp:**
- Kiểm tra file `.env` có đầy đủ 3 biến: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`
- Đảm bảo không có khoảng trắng thừa hoặc dấu ngoặc kép không cần thiết

### Lỗi: "Failed to create payment link"

**Nguyên nhân:** 
- Thông tin API không đúng
- Tài khoản PayOS chưa được kích hoạt
- Số tiền thanh toán không hợp lệ

**Giải pháp:**
- Kiểm tra lại thông tin API trong PayOS Dashboard
- Đảm bảo tài khoản PayOS đã được xác thực và kích hoạt
- Kiểm tra số tiền thanh toán (phải > 0)

### Webhook không hoạt động

**Nguyên nhân:**
- URL webhook chưa được cấu hình trong PayOS Dashboard
- Server không thể nhận request từ PayOS (firewall, CORS, etc.)

**Giải pháp:**
- Kiểm tra webhook URL trong PayOS Dashboard
- Đảm bảo server có thể nhận POST request từ internet
- Kiểm tra logs để xem có request từ PayOS không

## Migration Database

Sau khi cập nhật code, chạy migration để thêm PAYOS vào enum:

```bash
npx prisma migrate dev --name add_payos_support
```

Hoặc nếu đã có migration file:

```bash
npx prisma migrate deploy
```

## Tài liệu tham khảo

- PayOS Documentation: https://docs.payos.money/
- PayOS Node.js SDK: https://www.npmjs.com/package/@payos/node
- PayOS Dashboard: https://pay.payos.vn/

## So sánh với VietQR

| Tính năng | VietQR | PayOS |
|-----------|--------|-------|
| Phương thức thanh toán | QR Code | QR Code + Thẻ ngân hàng + Ví điện tử |
| Tích hợp | API đơn giản | API đầy đủ với webhook |
| Hỗ trợ | Chỉ QR Code | Nhiều phương thức |
| Phí giao dịch | Tùy ngân hàng | Theo bảng giá PayOS |
