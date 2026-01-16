# EZ-Home - Hệ thống quản lý nhà trọ

Hệ thống quản lý nhà trọ thông minh với giao diện admin và tenant portal.

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

Hoặc nếu npm không hoạt động, thử:

```bash
# Với yarn
yarn install

# Với pnpm
pnpm install
```

### 2. Setup Database

Tạo file `.env` trong thư mục root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ezhome"
DIRECT_URL="postgresql://user:password@localhost:5432/ezhome"
```

Chạy migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Tạo Admin User

Tạo admin user đầu tiên (chạy trong database hoặc tạo seed script):

```sql
-- Hash password "admin123" với bcrypt
-- Hoặc sử dụng script seed
```

Hoặc tạo file `prisma/seed.ts` để seed dữ liệu.

### 4. Chạy Development Server

```bash
npm run dev
```

Truy cập: `http://localhost:3000`

## Tính năng

### Admin Portal (`/admin`)
- Dashboard với thống kê
- Quản lý phòng
- Quản lý cư dân & hợp đồng
- Quản lý hóa đơn
- Bảo trì & sự cố
- Cấu hình dịch vụ

### Tenant Portal (`/tenant`)
- Dashboard cá nhân
- Xem và thanh toán hóa đơn
- Đặt dịch vụ
- Báo cáo sự cố
- Cộng đồng

## Authentication

- **Admin**: Đăng nhập với role ADMIN
- **Tenant**: 
  - Lần đầu: Đăng nhập với số điện thoại và mật khẩu = số CCCD
  - Bắt buộc đổi mật khẩu lần đầu
  - Các lần sau: Sử dụng mật khẩu mới

## Logic nghiệp vụ

### Tạo hợp đồng mới
1. Admin tạo cư dân mới tại `/admin/residents/new`
2. Hệ thống tự động:
   - Tạo user với password = CCCD (đã hash)
   - Set `isFirstLogin = true`
   - Tạo hợp đồng ACTIVE
   - Cập nhật phòng thành RENTED

### Đăng nhập lần đầu
1. Tenant đăng nhập với phone và password = CCCD
2. Tự động redirect đến `/tenant/change-password`
3. Bắt buộc đổi mật khẩu
4. Sau khi đổi thành công → redirect đến dashboard

## Tech Stack

- **Framework**: Next.js 16
- **Database**: PostgreSQL với Prisma ORM
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Authentication**: bcryptjs

## Cấu trúc thư mục

```
app/
  ├── admin/          # Admin portal pages
  ├── tenant/         # Tenant portal pages
  ├── login/          # Login page
  ├── api/            # API routes
  └── layout.tsx      # Root layout

lib/
  ├── prisma.ts       # Prisma client
  └── auth.ts         # Authentication utilities
```

## Lưu ý

- Đảm bảo đã cài đặt Node.js và npm
- Database phải được setup trước khi chạy
- Tất cả mật khẩu được hash bằng bcrypt
- Session được quản lý qua localStorage (trong production nên dùng httpOnly cookies)
