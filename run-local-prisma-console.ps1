Write-Host "Setting up local development with Prisma Console..." -ForegroundColor Green

Write-Host "Step 1: Navigating to backend directory..." -ForegroundColor Yellow
Set-Location backend

Write-Host "Step 2: Installing Prisma Accelerate extension..." -ForegroundColor Yellow
npm install @prisma/extension-accelerate

Write-Host "Step 3: Setting environment variables for Prisma Console..." -ForegroundColor Yellow
$env:DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19tSUpsbEgyMG9ZelhMZGRyRUhaanEiLCJhcGlfa2V5IjoiMDFLMjlCSERNVlFXUVpaQ0NKWjY4U0c4RFMiLCJ0ZW5hbnRfaWQiOiJiZDA5ZmE1N2Y4OTE1NjJlYmQ4OTNiM2ZhZjVmODMyZDg0N2YzOTZlMmYzOWU2MDA4NDA1NDlhNWI2MDk5Mzc4IiwiaW50ZXJuYWxfc2VjcmV0IjoiZTFjOGI3YzItMmE0MC00MDE4LWJkMTctOWZmMWFjNzA2NDc2In0.fSm5jzX6OhojytKxTMCdyFKASgiZSOvUZJtC1WFRTIQ"
$env:HOST = "0.0.0.0"
$env:PORT = "3001"
$env:BASE_URL = "http://localhost:3001"
$env:ADMIN_EMAIL = "admin@gmail.com"
$env:ADMIN_PASSWORD = "admin@123"
$env:JWT_SECRET = "your-jwt-secret-here"

Write-Host "Step 4: Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "Step 5: Deploying schema to Prisma Console..." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "Step 6: Seeding database in Prisma Console..." -ForegroundColor Yellow
npm run db:seed

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Your application is ready to run locally" -ForegroundColor Green
Write-Host "Data will be stored in Prisma Console (cloud)" -ForegroundColor Green

Write-Host "Starting application..." -ForegroundColor Cyan
Write-Host "Application will be available at: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Red

npm run start:dev
