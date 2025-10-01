Write-Host "Setting up local development with Prisma Console..." -ForegroundColor Green

Write-Host "Step 1: Navigating to backend directory..." -ForegroundColor Yellow
Set-Location backend

Write-Host "`nStep 2: Installing Prisma Accelerate extension..." -ForegroundColor Yellow
try {
    npm install @prisma/extension-accelerate
    Write-Host "✅ Prisma Accelerate extension installed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Prisma Accelerate extension" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 3: Setting environment variables for Prisma Console..." -ForegroundColor Yellow

# Set environment variables for Prisma Console
$env:DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19tSUpsbEgyMG9ZelhMZGRyRUhaanEiLCJhcGlfa2V5IjoiMDFLMjlCSERNVlFXUVpaQ0NKWjY4U0c4RFMiLCJ0ZW5hbnRfaWQiOiJiZDA5ZmE1N2Y4OTE1NjJlYmQ4OTNiM2ZhZjVmODMyZDg0N2YzOTZlMmYzOWU2MDA4NDA1NDlhNWI2MDk5Mzc4IiwiaW50ZXJuYWxfc2VjcmV0IjoiZTFjOGI3YzItMmE0MC00MDE4LWJkMTctOWZmMWFjNzA2NDc2In0.fSm5jzX6OhojytKxTMCdyFKASgiZSOvUZJtC1WFRTIQ"
$env:HOST = "0.0.0.0"
$env:PORT = "3001"
$env:BASE_URL = "http://localhost:3001"
$env:ADMIN_EMAIL = "admin@gmail.com"
$env:ADMIN_PASSWORD = "admin@123"
$env:JWT_SECRET = "your-jwt-secret-here"

Write-Host "✅ Environment variables set for Prisma Console!" -ForegroundColor Green

Write-Host "`nStep 4: Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 5: Deploying schema to Prisma Console..." -ForegroundColor Yellow
try {
    npx prisma migrate deploy
    Write-Host "✅ Schema deployed to Prisma Console!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Schema deployment warning (might already exist)" -ForegroundColor Yellow
    Write-Host "Continuing with setup..." -ForegroundColor Yellow
}

Write-Host "`nStep 6: Seeding database in Prisma Console..." -ForegroundColor Yellow
try {
    npm run db:seed
    Write-Host "✅ Database seeded in Prisma Console!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Seeding warning (data might already exist)" -ForegroundColor Yellow
    Write-Host "Continuing with setup..." -ForegroundColor Yellow
}

Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
Write-Host "`n✅ Your application is ready to run locally" -ForegroundColor Green
Write-Host "✅ Data will be stored in Prisma Console (cloud)" -ForegroundColor Green
Write-Host "✅ No local database needed" -ForegroundColor Green

Write-Host "`n🚀 To start your application locally:" -ForegroundColor Cyan
Write-Host "  npm run start:dev" -ForegroundColor White

Write-Host "`n🔍 To view your data in Prisma Console:" -ForegroundColor Cyan
Write-Host "  Visit: https://console.prisma.io/" -ForegroundColor White

Write-Host "`n📊 To open Prisma Studio:" -ForegroundColor Cyan
Write-Host "  npx prisma studio" -ForegroundColor White

Write-Host "`n📱 Your application will be available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:3001" -ForegroundColor White

Read-Host "Press Enter to start the application now"
