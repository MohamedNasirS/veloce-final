Write-Host "Fixing database schema issue..." -ForegroundColor Green

# Set environment variables for local PostgreSQL
$env:DATABASE_URL = "postgresql://veloce_user:veloce_password@localhost:5432/veloce"
$env:HOST = "0.0.0.0"
$env:PORT = "3001"
$env:BASE_URL = "http://localhost:3001"
$env:ADMIN_EMAIL = "admin@gmail.com"
$env:ADMIN_PASSWORD = "admin@123"
$env:JWT_SECRET = "your-jwt-secret-here"

Write-Host "`nStep 1: Creating local database..." -ForegroundColor Yellow

# Create database and user
try {
    psql -U postgres -c "CREATE DATABASE veloce;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Database might already exist, continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating database. Please ensure PostgreSQL is running." -ForegroundColor Red
}

try {
    psql -U postgres -c "CREATE USER veloce_user WITH PASSWORD 'veloce_password';" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "User might already exist, continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating user." -ForegroundColor Red
}

try {
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE veloce TO veloce_user;" 2>$null
} catch {
    Write-Host "Error granting privileges." -ForegroundColor Red
}

Write-Host "`nStep 2: Navigating to backend directory..." -ForegroundColor Yellow
Set-Location backend

Write-Host "`nStep 3: Removing old migration files..." -ForegroundColor Yellow
Remove-Item -Recurse -Force prisma\migrations -ErrorAction SilentlyContinue
Remove-Item -Force prisma\dev.db -ErrorAction SilentlyContinue

Write-Host "`nStep 4: Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`nStep 5: Creating fresh migration..." -ForegroundColor Yellow
npx prisma migrate dev --name init

Write-Host "`nStep 6: Seeding database..." -ForegroundColor Yellow
npm run db:seed

Write-Host "`n✅ Database setup complete!" -ForegroundColor Green
Write-Host "`nTo start the application:" -ForegroundColor Cyan
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host "`nThe application will be available at: http://localhost:3001" -ForegroundColor Green

Read-Host "`nPress Enter to continue"
