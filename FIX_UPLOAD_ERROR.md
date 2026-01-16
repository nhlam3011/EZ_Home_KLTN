# Hướng dẫn sửa lỗi "Failed to upload hồ sơ"

## Lỗi: "Cannot read properties of undefined (reading 'create')"

Lỗi này xảy ra vì Prisma Client chưa được generate lại sau khi thêm model Document mới.

## Cách sửa (3 bước):

### Bước 1: Generate Prisma Client
```bash
npx prisma generate
```

### Bước 2: Áp dụng migration vào database
```bash
npx prisma db push
```

Hoặc nếu dùng migration:
```bash
npx prisma migrate deploy
```

### Bước 3: Restart Dev Server
1. Dừng server hiện tại (nhấn `Ctrl+C` trong terminal)
2. Chạy lại:
```bash
npm run dev
```

## Kiểm tra xem đã sửa chưa:

Sau khi restart, thử upload file lại. Nếu vẫn lỗi, kiểm tra:

1. Xem console log của server có báo lỗi gì không
2. Kiểm tra xem bảng `Document` đã được tạo trong database chưa:
   ```sql
   SELECT * FROM "Document" LIMIT 1;
   ```

## Lưu ý:

- Phải restart dev server sau khi chạy `prisma generate`
- Nếu dùng production, cần rebuild: `npm run build`
