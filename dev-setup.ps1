# Zad Alhidaya Platform - Local Development Setup Script
# This script automates the complete local development environment setup
#
# Usage: .\dev-setup.ps1 [-SkipSeed]
#   -SkipSeed: Skip the database seeding step

param(
    [switch]$SkipSeed
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Zad Alhidaya Platform - Dev Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "[1/8] Installing dependencies..." -ForegroundColor Yellow
npm i
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Configure Prisma schema for SQLite
Write-Host "[2/8] Configuring Prisma schema for SQLite..." -ForegroundColor Yellow
$schemaPath = "apps/api/prisma/schema.prisma"
$schemaContent = Get-Content $schemaPath -Raw
$schemaContent = $schemaContent -replace 'provider\s*=\s*"postgresql"', 'provider = "sqlite"'
Set-Content $schemaPath $schemaContent
Write-Host "Prisma schema configured for SQLite!" -ForegroundColor Green
Write-Host ""

# Step 3: Copy and configure API environment
Write-Host "[3/8] Setting up API environment..." -ForegroundColor Yellow
Copy-Item "env-templates/api.env" "apps/api/.env" -Force

# Update API .env file with local development values
$apiEnvPath = "apps/api/.env"
$apiEnvContent = Get-Content $apiEnvPath -Raw
$apiEnvContent = $apiEnvContent -replace 'DATABASE_URL=.*', 'DATABASE_URL=file:./dev.db'
$apiEnvContent = $apiEnvContent -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=http://localhost:3000'
$apiEnvContent = $apiEnvContent -replace 'NODE_ENV=.*', 'NODE_ENV=development'
Set-Content $apiEnvPath $apiEnvContent
Write-Host "API environment configured!" -ForegroundColor Green
Write-Host ""

# Step 4: Copy and configure Web environment
Write-Host "[4/8] Setting up Web environment..." -ForegroundColor Yellow
Copy-Item "env-templates/web.env" "apps/web/.env.local" -Force

# Update Web .env.local file with local development values
$webEnvPath = "apps/web/.env.local"
$webEnvContent = Get-Content $webEnvPath -Raw
$webEnvContent = $webEnvContent -replace 'NEXT_PUBLIC_API_URL=.*', 'NEXT_PUBLIC_API_URL=http://localhost:3001'
$webEnvContent = $webEnvContent -replace 'NEXT_PUBLIC_FRONTEND_URL=.*', 'NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000'
Set-Content $webEnvPath $webEnvContent
Write-Host "Web environment configured!" -ForegroundColor Green
Write-Host ""

# Step 5: Generate Prisma client
Write-Host "[5/8] Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Prisma generate failed" -ForegroundColor Red
    exit 1
}
Write-Host "Prisma client generated!" -ForegroundColor Green
Write-Host ""

# Step 6: Run database migrations
Write-Host "[6/8] Running database migrations..." -ForegroundColor Yellow
npm run db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Database migration failed" -ForegroundColor Red
    exit 1
}
Write-Host "Database migrations completed!" -ForegroundColor Green
Write-Host ""

# Step 7: Seed the database
if ($SkipSeed) {
    Write-Host "[7/8] Skipping database seeding (--SkipSeed flag provided)" -ForegroundColor Gray
} else {
    Write-Host "[7/8] Seeding database..." -ForegroundColor Yellow
    npm run db:seed
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Database seeding failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "Database seeded!" -ForegroundColor Green
}
Write-Host ""

# Step 8: Start development server
Write-Host "[8/8] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Starting servers..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Web:  http://localhost:3000" -ForegroundColor Green
Write-Host "  API:  http://localhost:3001" -ForegroundColor Green
Write-Host ""

# Open browser after a short delay to allow server to start
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:3000"
} | Out-Null

npm run dev
