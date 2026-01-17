# Fix Prisma Payment Error
# This script generates Prisma Client and syncs database schema

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix Prisma Payment Error" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
$projectPath = "c:\Users\Administrator\ez-home"
Set-Location $projectPath

Write-Host "[1/3] Validating Prisma schema..." -ForegroundColor Yellow
try {
    npx prisma validate
    Write-Host "✓ Schema is valid" -ForegroundColor Green
} catch {
    Write-Host "✗ Schema validation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✓ Prisma Client generated successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    try {
        npm exec prisma generate
        Write-Host "✓ Prisma Client generated successfully (using npm exec)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Still failed. Please run manually:" -ForegroundColor Red
        Write-Host "  npx prisma generate" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "[3/3] Syncing database schema..." -ForegroundColor Yellow
try {
    npx prisma db push
    Write-Host "✓ Database schema synced successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to sync database schema" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "You may need to run migration manually:" -ForegroundColor Yellow
    Write-Host "  npx prisma migrate dev --name add_payment_model" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Please restart your Next.js server:" -ForegroundColor Yellow
Write-Host "  1. Stop the server (Ctrl+C)" -ForegroundColor White
Write-Host "  2. Run: npm run dev" -ForegroundColor White
Write-Host ""
