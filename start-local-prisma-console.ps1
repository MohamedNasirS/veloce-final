Write-Host "Starting local application with Prisma Console..." -ForegroundColor Green

# Navigate to backend
Set-Location backend

# Set environment variables for Prisma Console
$env:DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19tSUpsbEgyMG9ZelhMZGRyRUhaanEiLCJhcGlfa2V5IjoiMDFLMjlCSERNVlFXUVpaQ0NKWjY4U0c4RFMiLCJ0ZW5hbnRfaWQiOiJiZDA5ZmE1N2Y4OTE1NjJlYmQ4OTNiM2ZhZjVmODMyZDg0N2YzOTZlMmYzOWU2MDA4NDA1NDlhNWI2MDk5Mzc4IiwiaW50ZXJuYWxfc2VjcmV0IjoiZTFjOGI3YzItMmE0MC00MDE4LWJkMTctOWZmMWFjNzA2NDc2In0.fSm5jzX6OhojytKxTMCdyFKASgiZSOvUZJtC1WFRTIQ"
$env:HOST = "0.0.0.0"
$env:PORT = "3001"
$env:BASE_URL = "http://localhost:3001"
$env:ADMIN_EMAIL = "admin@gmail.com"
$env:ADMIN_PASSWORD = "admin@123"
$env:JWT_SECRET = "your-jwt-secret-here"

Write-Host "`nEnvironment configured for Prisma Console!" -ForegroundColor Green
Write-Host "`n🚀 Starting application in development mode..." -ForegroundColor Cyan
Write-Host "📱 Application will be available at: http://localhost:3001" -ForegroundColor Yellow
Write-Host "🌐 Data is stored in Prisma Console (cloud)" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Red

# Start the application
npm run start:dev
