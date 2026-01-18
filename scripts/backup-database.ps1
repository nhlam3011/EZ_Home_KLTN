# Script backup database trước khi migrate
# Sử dụng Supabase hoặc PostgreSQL connection string

param(
    [string]$OutputFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKUP DATABASE - EZ-HOME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lấy connection string từ .env
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "✗ Không tìm thấy file .env" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile
$databaseUrl = ""
foreach ($line in $envContent) {
    if ($line -match "^DATABASE_URL=(.+)$") {
        $databaseUrl = $matches[1]
        break
    }
}

if (-not $databaseUrl) {
    Write-Host "✗ Không tìm thấy DATABASE_URL trong .env" -ForegroundColor Red
    exit 1
}

Write-Host "[1/2] Đang backup database..." -ForegroundColor Yellow

# Parse connection string
# Format: postgresql://user:password@host:port/database
if ($databaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "  Host: $dbHost" -ForegroundColor Gray
    Write-Host "  Database: $dbName" -ForegroundColor Gray
    Write-Host "  Output: $OutputFile" -ForegroundColor Gray
    Write-Host ""
    
    # Kiểm tra xem có pg_dump không
    $pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
    if (-not $pgDumpPath) {
        Write-Host "✗ Không tìm thấy pg_dump" -ForegroundColor Red
        Write-Host "  Vui lòng cài đặt PostgreSQL client tools" -ForegroundColor Yellow
        Write-Host "  Hoặc sử dụng Prisma Studio để export data thủ công" -ForegroundColor Yellow
        exit 1
    }
    
    # Set password environment variable
    $env:PGPASSWORD = $dbPassword
    
    # Backup database
    try {
        & pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName -F c -f $OutputFile
        Write-Host "✓ Backup thành công: $OutputFile" -ForegroundColor Green
    } catch {
        Write-Host "✗ Lỗi khi backup: $_" -ForegroundColor Red
        exit 1
    } finally {
        Remove-Item Env:\PGPASSWORD
    }
} else {
    Write-Host "✗ Không thể parse DATABASE_URL" -ForegroundColor Red
    Write-Host "  Format mong đợi: postgresql://user:password@host:port/database" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/2] Kiểm tra file backup..." -ForegroundColor Yellow
if (Test-Path $OutputFile) {
    $fileSize = (Get-Item $OutputFile).Length
    Write-Host "✓ File backup: $OutputFile ($([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "✗ File backup không tồn tại" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backup hoàn tất!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Để restore backup:" -ForegroundColor Yellow
Write-Host "  pg_restore -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $OutputFile" -ForegroundColor White
Write-Host ""
