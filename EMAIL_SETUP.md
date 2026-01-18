# Cấu hình Email Notifications

Hệ thống EZ-Home hỗ trợ gửi email thông báo tự động cho khách hàng về các sự kiện quan trọng.

## Các sự kiện gửi email

1. **Hóa đơn mới**: Khi admin tạo hóa đơn mới cho tenant
2. **Tin nhắn về hóa đơn**: Khi admin gửi tin nhắn liên quan đến hóa đơn
3. **Cập nhật trạng thái sự cố**: Khi trạng thái sự cố/bảo trì được cập nhật (PENDING, PROCESSING, DONE, CANCELLED)
4. **Hóa đơn từ sự cố**: Khi tạo hóa đơn phát sinh từ việc xử lý sự cố

## Cấu hình SMTP

Thêm các biến môi trường sau vào file `.env`:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Ví dụ cấu hình Gmail cụ thể

Nếu email Gmail của bạn là `example@gmail.com`, bạn sẽ cấu hình như sau:

```env
# SMTP Configuration cho Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=example@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

**Giải thích:**
- `SMTP_HOST=smtp.gmail.com` - **Giữ nguyên**, đây là địa chỉ máy chủ SMTP của Gmail
- `SMTP_USER=example@gmail.com` - **Thay bằng email Gmail thật của bạn** (ví dụ: `myemail@gmail.com`, `company@gmail.com`, v.v.)
- `SMTP_PASS` - Mật khẩu ứng dụng 16 ký tự (xem hướng dẫn bên dưới)

### Cấu hình Gmail

1. **Bật 2-Step Verification** cho tài khoản Gmail của bạn
   - Vào [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → Bật xác thực 2 bước

2. **Tạo App Password**:
   - Vào [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Chọn "Mail" và "Other (Custom name)" → Nhập "EZ-Home"
   - Click "Generate"
   - **Sao chép mật khẩu 16 ký tự** (có dạng: `abcd efgh ijkl mnop`) và dán vào `SMTP_PASS`
   - ⚠️ **Lưu ý**: Bỏ khoảng trắng giữa các ký tự, hoặc giữ nguyên đều được

### Cấu hình SMTP khác

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
# hoặc cho SSL/TLS
SMTP_PORT=465
SMTP_SECURE=true
```

## Lưu ý

- Nếu không cấu hình email, hệ thống vẫn hoạt động bình thường nhưng sẽ không gửi email (chỉ log warning)
- Email chỉ được gửi khi tenant có email trong hệ thống
- Email được gửi bất đồng bộ, không ảnh hưởng đến hiệu suất của API

## Kiểm tra

Sau khi cấu hình, kiểm tra logs để xác nhận email được gửi thành công:
- Thành công: `Email sent successfully: <message-id>`
- Lỗi: `Error sending email: <error details>`
- Chưa cấu hình: `Email credentials not configured. Email notifications will be disabled.`
