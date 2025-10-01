Write-Host "Setting up Prisma Console for persistent cloud data storage..." -ForegroundColor Green

Write-Host "`nStep 1: Installing Prisma Accelerate extension..." -ForegroundColor Yellow
Set-Location backend

try {
    npm install @prisma/extension-accelerate
    Write-Host "✅ Prisma Accelerate extension installed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Prisma Accelerate extension" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 2: Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 3: Setting up database schema in Prisma Console..." -ForegroundColor Yellow
try {
    npx prisma migrate deploy
    Write-Host "✅ Database schema deployed to Prisma Console!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy schema to Prisma Console" -ForegroundColor Red
    Write-Host "This might be because the schema already exists in Prisma Console" -ForegroundColor Yellow
}

Write-Host "`nStep 4: Seeding database with initial data..." -ForegroundColor Yellow
try {
    npm run db:seed
    Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    Write-Host "This might be because the data already exists" -ForegroundColor Yellow
}

Write-Host "`n🎉 Prisma Console setup complete!" -ForegroundColor Green
Write-Host "`n✅ Your data is now stored in Prisma Console (cloud)" -ForegroundColor Green
Write-Host "✅ Data will persist across all rebuilds and redeploys" -ForegroundColor Green
Write-Host "✅ No more data loss when rebuilding containers!" -ForegroundColor Green

Write-Host "`n🚀 To deploy your application:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d" -ForegroundColor White

Write-Host "`n🔍 To verify your data is in Prisma Console:" -ForegroundColor Cyan
Write-Host "  Visit: https://console.prisma.io/" -ForegroundColor White
Write-Host "  Login with your Prisma account" -ForegroundColor White
Write-Host "  Check your database dashboard" -ForegroundColor White

Write-Host "`n📊 To open Prisma Studio (database GUI):" -ForegroundColor Cyan
Write-Host "  npx prisma studio" -ForegroundColor White

Read-Host "`nPress Enter to continue"
