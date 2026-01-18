# ⚠️ CẢNH BÁO: An toàn khi migrate database

## Vấn đề

`npx prisma migrate dev` có thể **RESET DATABASE** và **XÓA HẾT DỮ LIỆU** trong development mode!

## Giải pháp an toàn

### 1. Sử dụng `prisma db push` (KHUYẾN NGHỊ)

```powershell
# Chạy script an toàn
.\scripts\safe-migrate.ps1
```

Hoặc chạy thủ công:

```powershell
# Validate schema
npx prisma validate

# Push schema changes (KHÔNG reset database)
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

**Ưu điểm:**
- ✅ Không reset database
- ✅ Giữ nguyên dữ liệu
- ✅ Nhanh hơn migrate
- ✅ An toàn cho development

**Nhược điểm:**
- ❌ Không tạo migration file
- ❌ Không track migration history

### 2. Backup trước khi migrate

```powershell
# Backup database trước
.\scripts\backup-database.ps1

# Sau đó mới migrate
npx prisma migrate dev
```

### 3. Sử dụng `prisma migrate deploy` (Production)

Trong production, sử dụng `migrate deploy` thay vì `migrate dev`:

```powershell
npx prisma migrate deploy
```

**Lưu ý:** `migrate deploy` chỉ apply các migration đã có, không reset database.

## Khôi phục dữ liệu

### Nếu đã có backup:

```powershell
# Restore từ backup file
pg_restore -h [host] -p [port] -U [user] -d [database] -c backup_file.sql
```

### Nếu không có backup:

1. **Kiểm tra Prisma Studio:**
   ```powershell
   npx prisma studio
   ```
   Mở `http://localhost:5555` để xem dữ liệu còn lại

2. **Chạy seed (nếu có):**
   ```powershell
   npx prisma db seed
   ```

3. **Kiểm tra database trực tiếp:**
   ```sql
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Invoice";
   SELECT COUNT(*) FROM "Room";
   ```

## Best Practices

1. **Luôn backup trước khi migrate:**
   ```powershell
   .\scripts\backup-database.ps1
   ```

2. **Sử dụng `db push` trong development:**
   ```powershell
   npx prisma db push
   ```

3. **Chỉ dùng `migrate dev` khi:**
   - Đã backup database
   - Cần tạo migration file
   - Chấp nhận rủi ro reset database

4. **Trong production:**
   - Luôn dùng `migrate deploy`
   - Không bao giờ dùng `migrate dev`
   - Backup trước mỗi lần deploy

## Tạo migration file thủ công

Nếu muốn tạo migration file nhưng không muốn reset database:

1. Tạo migration file thủ công trong `prisma/migrations/[timestamp]_[name]/migration.sql`
2. Chạy SQL trực tiếp:
   ```powershell
   psql $DATABASE_URL -f prisma/migrations/[timestamp]_[name]/migration.sql
   ```
3. Mark migration là đã apply:
   ```powershell
   npx prisma migrate resolve --applied [timestamp]_[name]
   ```

## Kiểm tra migration status

```powershell
# Xem migration history
npx prisma migrate status

# Xem migration đã apply
npx prisma migrate list
```

## Liên hệ

Nếu gặp vấn đề, kiểm tra:
- File `.env` có đúng DATABASE_URL không
- Database connection có hoạt động không
- Schema có syntax error không
