# Sửa lỗi "Invalid prisma.payment.create() invocation"

## Nguyên nhân

Lỗi này xảy ra khi Prisma Client chưa được generate lại sau khi thêm hoặc cập nhật Payment model trong schema.

## Giải pháp

### Bước 1: Generate Prisma Client

Chạy lệnh sau để generate lại Prisma Client:

```bash
cd c:\Users\Administrator\ez-home
npx prisma generate
```

Nếu `npx` không hoạt động, thử:

```bash
# Với npm
npm exec prisma generate

# Hoặc với yarn
yarn prisma generate

# Hoặc với pnpm
pnpm prisma generate
```

### Bước 2: Chạy Migration (nếu chưa chạy)

Nếu bảng Payment chưa được tạo trong database:

```bash
npx prisma migrate dev --name add_payment_model
```

Hoặc dùng `db push` (nhanh hơn, không tạo migration file):

```bash
npx prisma db push
```

### Bước 3: Khởi động lại server

Sau khi generate Prisma Client, **bắt buộc phải restart server**:

```bash
# Dừng server (Ctrl+C)
# Sau đó khởi động lại
npm run dev
```

---

## Kiểm tra

### 1. Kiểm tra Prisma Client đã được generate

Xem file:
```
node_modules/.prisma/client/index.d.ts
```

Tìm `Payment` model trong file này. Nếu không có, Prisma Client chưa được generate.

### 2. Kiểm tra Database có bảng Payment

Có thể dùng Prisma Studio:

```bash
npx prisma studio
```

Mở browser tại `http://localhost:5555` và kiểm tra xem có bảng `Payment` không.

### 3. Test tạo payment

Sau khi restart server, thử tạo payment lại. Nếu vẫn lỗi, xem console logs để biết chi tiết.

---

## Troubleshooting

### Lỗi: "npx is not recognized"

**Giải pháp:**
1. Cài đặt Node.js từ https://nodejs.org/
2. Hoặc thêm Node.js vào PATH
3. Hoặc dùng `npm exec` thay vì `npx`

### Lỗi: "Schema validation error"

**Giải pháp:**
1. Kiểm tra file `prisma/schema.prisma` có syntax error không
2. Kiểm tra Payment model có đúng format không
3. Chạy `npx prisma validate` để kiểm tra

### Lỗi: "Table Payment does not exist"

**Giải pháp:**
1. Chạy migration: `npx prisma migrate dev`
2. Hoặc dùng `npx prisma db push` để sync schema với database

### Vẫn lỗi sau khi generate

**Giải pháp:**
1. Xóa `.next` folder: `rm -rf .next` (hoặc xóa thủ công)
2. Xóa `node_modules/.prisma` folder
3. Chạy lại:
   ```bash
   npx prisma generate
   npm run dev
   ```

---

## Quick Fix Script

Tạo file `fix-prisma.ps1`:

```powershell
# fix-prisma.ps1
cd c:\Users\Administrator\ez-home
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "Pushing schema to database..." -ForegroundColor Yellow
npx prisma db push
Write-Host "Done! Please restart your server." -ForegroundColor Green
```

Chạy:
```powershell
.\fix-prisma.ps1
```

---

## Verification

Sau khi fix, kiểm tra:

1. ✅ Prisma Client đã được generate
2. ✅ Database có bảng Payment
3. ✅ Server đã được restart
4. ✅ Có thể tạo payment record thành công

---

## Next Steps

Sau khi fix xong:
1. Test tạo payment qua VietQR
2. Kiểm tra payment records trong database
