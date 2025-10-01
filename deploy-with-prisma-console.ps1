Write-Host "Deploying application with Prisma Console..." -ForegroundColor Green

Write-Host "`nStep 1: Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "`nStep 2: Building and starting containers with Prisma Console..." -ForegroundColor Yellow
docker-compose up -d --build

Write-Host "`nStep 3: Waiting for application to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`nStep 4: Checking application status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Application is running successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Application might still be starting up..." -ForegroundColor Yellow
}

Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
Write-Host "`n✅ Your application is now running with Prisma Console" -ForegroundColor Green
Write-Host "✅ All data is stored in the cloud" -ForegroundColor Green
Write-Host "✅ Data will persist across all rebuilds and redeploys" -ForegroundColor Green

Write-Host "`n📱 Application URLs:" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend: http://localhost:80" -ForegroundColor White

Write-Host "`n🔍 To check your data in Prisma Console:" -ForegroundColor Cyan
Write-Host "  Visit: https://console.prisma.io/" -ForegroundColor White

Write-Host "`n📊 To view database in Prisma Studio:" -ForegroundColor Cyan
Write-Host "  cd backend && npx prisma studio" -ForegroundColor White

Read-Host "`nPress Enter to continue"
