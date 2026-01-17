# Hướng dẫn Test VietQR Callback Endpoint

## Endpoint URL

```
http://localhost:3000/api/payments/vietqr/callback
```

## Methods hỗ trợ

- **GET**: Test thủ công hoặc xem thông tin endpoint
- **POST**: Nhận webhook từ VietQR

---

## 1. Test với GET (Manual Testing)

### Xem thông tin endpoint

```bash
curl http://localhost:3000/api/payments/vietqr/callback
```

Response:
```json
{
  "endpoint": "/api/payments/vietqr/callback",
  "methods": ["GET", "POST"],
  "description": "VietQR payment callback endpoint",
  "usage": {
    "GET": "Test with query params: ?orderId=xxx&status=success&amount=100000",
    "POST": "Receive webhook from VietQR with JSON body"
  }
}
```

### Test với query parameters

```bash
# Test thanh toán thành công
curl "http://localhost:3000/api/payments/vietqr/callback?orderId=INV1_5_1234567890&status=success&amount=100000&transactionId=TXN123&bankCode=970422"

# Test thanh toán thất bại
curl "http://localhost:3000/api/payments/vietqr/callback?orderId=INV1_5_1234567890&status=failed&amount=100000"
```

---

## 2. Test với POST (Webhook Simulation)

### Test với JSON body

```bash
curl -X POST http://localhost:3000/api/payments/vietqr/callback \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "INV1_5_1234567890",
    "status": "success",
    "amount": "100000",
    "transactionId": "TXN123",
    "bankCode": "970422",
    "accountNo": "1234567890",
    "accountName": "NGUYEN VAN A",
    "description": "Thanh toan hoa don",
    "timestamp": "2026-01-17T10:30:00Z"
  }'
```

### Test với form data

```bash
curl -X POST http://localhost:3000/api/payments/vietqr/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "orderId=INV1_5_1234567890&status=success&amount=100000"
```

---

## 3. Response Format

### Success Response

```json
{
  "code": "00",
  "message": "Success",
  "success": true,
  "data": {
    "paymentId": 1,
    "invoiceId": 123,
    "status": "SUCCESS"
  }
}
```

### Error Responses

**Payment not found:**
```json
{
  "code": "PAYMENT_NOT_FOUND",
  "message": "Payment not found",
  "error": "Payment not found for orderId: INV1_5_1234567890"
}
```

**Invalid signature:**
```json
{
  "code": "INVALID_SIGNATURE",
  "message": "Invalid signature",
  "error": "Invalid signature"
}
```

**Internal error:**
```json
{
  "code": "INTERNAL_ERROR",
  "message": "Failed to process callback",
  "error": "Error details (only in development)"
}
```

---

## 4. Kiểm tra Logs

Endpoint sẽ log chi tiết trong console:

```
=== VietQR Callback Received ===
Method: POST
Headers: {...}
Body: {...}
Parsed params: {...}
Signature: Present/Missing
Parsed callback data: {...}
Found payment: {...}
Payment updated: {...}
Invoice updated: {...}
=== Callback Processed Successfully ===
```

---

## 5. Test với Postman

### GET Request
1. Method: `GET`
2. URL: `http://localhost:3000/api/payments/vietqr/callback`
3. Params:
   - `orderId`: `INV1_5_1234567890`
   - `status`: `success`
   - `amount`: `100000`

### POST Request
1. Method: `POST`
2. URL: `http://localhost:3000/api/payments/vietqr/callback`
3. Headers:
   - `Content-Type`: `application/json`
4. Body (raw JSON):
```json
{
  "orderId": "INV1_5_1234567890",
  "status": "success",
  "amount": "100000",
  "transactionId": "TXN123",
  "bankCode": "970422"
}
```

---

## 6. Test với Browser

Mở browser và truy cập:

```
http://localhost:3000/api/payments/vietqr/callback?orderId=INV1_5_1234567890&status=success&amount=100000
```

---

## 7. Cấu hình trong VietQR Dashboard

Khi đăng ký với VietQR, cấu hình callback URL:

```
http://localhost:3000/api/payments/vietqr/callback
```

**Lưu ý**: 
- Cho production, thay `localhost:3000` bằng domain thật
- URL phải là public (không thể dùng localhost cho production)
- Có thể dùng ngrok để test local: `ngrok http 3000`

---

## 8. Troubleshooting

### Payment not found
- Kiểm tra `orderId` có đúng format không: `INV{invoiceId}_{paymentId}_{timestamp}`
- Kiểm tra payment record có được tạo trong database không
- Xem logs để thấy `transactionId` thực tế

### Signature verification failed
- Kiểm tra VietQR có gửi signature không
- Kiểm tra header `x-vietqr-signature` hoặc `signature`
- Cập nhật logic verify theo tài liệu VietQR

### Callback không được gọi
- Kiểm tra URL callback có đúng trong VietQR dashboard không
- Kiểm tra server có accessible từ internet không (dùng ngrok cho local)
- Kiểm tra firewall không chặn request

---

## 9. Ngrok Setup (Test Local)

```bash
# Install ngrok
# https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3000

# Sử dụng URL từ ngrok
# Ví dụ: https://abc123.ngrok.io/api/payments/vietqr/callback
```

Cấu hình URL này trong VietQR dashboard để test.

---

## 10. Production Checklist

- [ ] Callback URL đã được cấu hình trong VietQR dashboard
- [ ] URL là HTTPS và public accessible
- [ ] Signature verification đã được implement đúng
- [ ] Error handling đã được test
- [ ] Logs được monitor
- [ ] Database có backup
- [ ] Rate limiting được setup (nếu cần)
