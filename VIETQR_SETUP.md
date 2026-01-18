# Hướng dẫn cấu hình VietQR

## Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# VietQR API Credentials (BẮT BUỘC)
VIETQR_CLIENT_ID=your_client_id_here
VIETQR_API_KEY=your_api_key_here

# Thông tin tài khoản ngân hàng (BẮT BUỘC)
VIETQR_ACCOUNT_NO=1234567890
VIETQR_ACCOUNT_NAME=EZ-HOME MANAGEMENT

# Mã BIN ngân hàng - 6 chữ số (BẮT BUỘC)
# Ví dụ: 970415 (ACB), 970418 (BIDV), 970422 (MBB)
# Xem danh sách đầy đủ tại: https://api.vietqr.io/v2/banks
VIETQR_BANK_BIN=970415

# Template QR code (TÙY CHỌN)
# Các template có sẵn: compact, compact2, qr_only
VIETQR_TEMPLATE=compact2
```

## Lấy thông tin từ VietQR

1. **Client ID và API Key:**
   - Đăng nhập vào tài khoản VietQR của bạn
   - Vào phần API/Developer
   - Copy Client ID và API Key

2. **Account Number:**
   - Số tài khoản ngân hàng của bạn (không bao gồm mã BIN)
   - Ví dụ: Nếu số tài khoản đầy đủ là `9704151234567890`, thì `VIETQR_ACCOUNT_NO=1234567890`
   - **Lưu ý:** Nếu số tài khoản của bạn bao gồm BIN (bắt đầu bằng 970), hệ thống sẽ tự động tách BIN ra

3. **Bank BIN (Mã định danh ngân hàng):**
   - Phải là 6 chữ số
   - Ví dụ: `970415` (ACB), `970418` (BIDV), `970422` (MBB)
   - Xem danh sách đầy đủ: https://api.vietqr.io/v2/banks
   - **Lưu ý:** Nếu không set `VIETQR_BANK_BIN`, hệ thống sẽ tự động lấy từ 6 chữ số đầu của `VIETQR_ACCOUNT_NO` (nếu số tài khoản bao gồm BIN)

4. **Account Name:**
   - Tên chủ tài khoản (tên hiển thị trên QR code)
   - Tối đa 25 ký tự

## Cách sử dụng

1. Cấu hình các biến môi trường trong `.env`
2. Restart server: `npm run dev`
3. Người dùng có thể:
   - Click "Thanh toán VietQR" trên hóa đơn chưa thanh toán
   - Quét QR code bằng app ngân hàng
   - Hệ thống tự động kiểm tra thanh toán hoặc click "Đã thanh toán" để xác nhận thủ công

## Troubleshooting

### Lỗi: "Invalid acqId"
- **Nguyên nhân:** Mã BIN không đúng hoặc không phải 6 chữ số
- **Giải pháp:**
  - Kiểm tra `VIETQR_BANK_BIN` có đúng 6 chữ số không (ví dụ: `970415`)
  - Xem danh sách BIN hợp lệ tại: https://api.vietqr.io/v2/banks
  - Đảm bảo BIN khớp với ngân hàng của số tài khoản

### Lỗi: "VietQR configuration is incomplete"
- Kiểm tra tất cả các biến môi trường đã được set trong `.env`
- Đảm bảo không có khoảng trắng thừa
- Đặc biệt kiểm tra `VIETQR_BANK_BIN` đã được set

### QR code không hiển thị
- Kiểm tra Client ID và API Key có đúng không
- Kiểm tra console logs để xem lỗi từ VietQR API
- Đảm bảo tài khoản VietQR của bạn đã được kích hoạt
- Kiểm tra BIN có đúng không

### QR code không quét được
- Kiểm tra số tài khoản có đúng không
- Kiểm tra tên tài khoản không quá dài
- Kiểm tra BIN có khớp với ngân hàng không
- Thử với template khác (compact, compact2, qr_only)

## API Documentation

Tham khảo: https://developer.vietqr.io/
