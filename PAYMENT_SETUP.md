# Hướng dẫn tích hợp thanh toán online VNPay

## Cấu hình môi trường

Thêm các biến môi trường sau vào file `.env`:

```env
# VNPay Configuration
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html  # Sandbox
# VNPAY_URL=https://www.vnpayment.vn/paymentv2/vpcpay.html    # Production
VNPAY_RETURN_URL=http://localhost:3000/api/payments/vnpay-callback  # Development
# VNPAY_RETURN_URL=https://yourdomain.com/api/payments/vnpay-callback  # Production
```

## Lấy thông tin VNPay

1. Đăng ký tài khoản tại [VNPay](https://www.vnpayment.vn/)
2. Tạo merchant account
3. Lấy `TMN_CODE` và `HASH_SECRET` từ dashboard
4. Cấu hình Return URL trong VNPay dashboard: `https://yourdomain.com/api/payments/vnpay-callback`

## Chạy migration

Sau khi cập nhật schema, chạy migration:

```bash
npx prisma migrate dev --name add_payment_model
npx prisma generate
```

## Cách hoạt động

1. **Tạo thanh toán**: User click "THANH TOÁN ONLINE QUA VNPay"
2. **Tạo payment record**: Hệ thống tạo record trong bảng `Payment`
3. **Redirect đến VNPay**: User được redirect đến trang thanh toán VNPay
4. **Xử lý callback**: Sau khi thanh toán, VNPay redirect về `/api/payments/vnpay-callback`
5. **Cập nhật trạng thái**: Hệ thống verify signature và cập nhật invoice status

## Models

### Payment Model
- `id`: ID thanh toán
- `invoiceId`: ID hóa đơn
- `amount`: Số tiền
- `method`: Phương thức (VNPAY, MOMO, BANK_TRANSFER, CASH)
- `status`: Trạng thái (PENDING, SUCCESS, FAILED, CANCELLED)
- `transactionId`: ID giao dịch từ VNPay
- `paymentUrl`: URL thanh toán
- `vnpResponse`: Raw response từ VNPay
- `paidAt`: Thời gian thanh toán thành công

## API Endpoints

### POST `/api/payments/create`
Tạo payment và lấy VNPay payment URL

**Request:**
```json
{
  "invoiceId": 123
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": 456,
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "transactionId": "INV123_456_1234567890"
}
```

### GET `/api/payments/vnpay-callback`
Xử lý callback từ VNPay sau khi thanh toán

**Query params:** Tất cả params từ VNPay (vnp_ResponseCode, vnp_TxnRef, etc.)

**Response:** Redirect đến `/tenant/invoices` với kết quả

## Testing

1. Sử dụng VNPay Sandbox để test
2. Test với các response code khác nhau
3. Verify signature validation
4. Test với các trường hợp lỗi

## Production Checklist

- [ ] Cập nhật `VNPAY_URL` sang production URL
- [ ] Cập nhật `VNPAY_RETURN_URL` sang production domain
- [ ] Đảm bảo HTTPS được bật
- [ ] Test toàn bộ flow thanh toán
- [ ] Cấu hình webhook trong VNPay dashboard
- [ ] Monitor payment logs
