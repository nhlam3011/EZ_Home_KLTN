# Script restore database cho Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTORE DATABASE - EZ-HOME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Xóa bảng Payment (nếu đã tồn tại)
Write-Host "[1/4] Tạo migration để xóa bảng Payment..." -ForegroundColor Yellow
Write-Host "Chạy: npx prisma migrate dev --name remove_payment_model" -ForegroundColor Gray
Write-Host ""

# Bước 2: Generate Prisma Client
Write-Host "[2/4] Generate Prisma Client..." -ForegroundColor Yellow
Write-Host "Chạy: npx prisma generate" -ForegroundColor Gray
Write-Host ""

# Bước 3: Kiểm tra dữ liệu
Write-Host "[3/4] Kiểm tra dữ liệu..." -ForegroundColor Yellow
Write-Host "Chạy: npx prisma studio" -ForegroundColor Gray
Write-Host "Hoặc query: SELECT COUNT(*) FROM \"User\";" -ForegroundColor Gray
Write-Host ""

# Bước 4: Restore data từ seed (nếu cần)
Write-Host "[4/4] Restore data mẫu (nếu cần)..." -ForegroundColor Yellow
Write-Host "Chạy: npx prisma db seed" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HƯỚNG DẪN CHI TIẾT:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Xóa bảng Payment:" -ForegroundColor Green
Write-Host "   npx prisma migrate dev --name remove_payment_model" -ForegroundColor White
Write-Host ""
Write-Host "2. Generate Prisma Client:" -ForegroundColor Green
Write-Host "   npx prisma generate" -ForegroundColor White
Write-Host ""
Write-Host "3. Kiểm tra dữ liệu:" -ForegroundColor Green
Write-Host "   npx prisma studio" -ForegroundColor White
Write-Host ""
Write-Host "4. Nếu cần restore data mẫu:" -ForegroundColor Green
Write-Host "   npx prisma db seed" -ForegroundColor White
Write-Host ""
Write-Host "5. Nếu có backup SQL:" -ForegroundColor Green
Write-Host "   psql -d your_database_name < backup_file.sql" -ForegroundColor White
Write-Host ""
