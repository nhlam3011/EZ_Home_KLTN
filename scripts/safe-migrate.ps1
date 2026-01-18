# Script migrate an toàn - không reset database
# Sử dụng prisma db push thay vì migrate dev

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SAFE MIGRATION - EZ-HOME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  CẢNH BÁO: prisma migrate dev có thể reset database!" -ForegroundColor Yellow
Write-Host "   Script này sử dụng prisma db push để tránh mất dữ liệu" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Bạn có muốn tiếp tục? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Đã hủy" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/3] Validating schema..." -ForegroundColor Yellow
try {
    npx prisma validate
    Write-Host "✓ Schema hợp lệ" -ForegroundColor Green
} catch {
    Write-Host "✗ Schema không hợp lệ" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Pushing schema changes (không reset database)..." -ForegroundColor Yellow
try {
    npx prisma db push --accept-data-loss
    Write-Host "✓ Schema đã được cập nhật" -ForegroundColor Green
} catch {
    Write-Host "✗ Lỗi khi push schema" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/3] Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✓ Prisma Client đã được generate" -ForegroundColor Green
} catch {
    Write-Host "✗ Lỗi khi generate Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migration hoàn tất!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  LƯU Ý:" -ForegroundColor Yellow
Write-Host "   - Dữ liệu đã được giữ nguyên" -ForegroundColor White
Write-Host "   - Schema đã được cập nhật" -ForegroundColor White
Write-Host "   - Hãy restart server: npm run dev" -ForegroundColor White
Write-Host ""
