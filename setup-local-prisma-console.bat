@echo off
echo Setting up local development with Prisma Console...

echo.
echo Step 1: Navigating to backend directory...
cd backend

echo.
echo Step 2: Installing Prisma Accelerate extension...
call npm install @prisma/extension-accelerate
if %errorlevel% neq 0 (
    echo Failed to install Prisma Accelerate extension
    pause
    exit /b 1
)
echo Prisma Accelerate extension installed!

echo.
echo Step 3: Setting environment variables for Prisma Console...
set DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19tSUpsbEgyMG9ZelhMZGRyRUhaanEiLCJhcGlfa2V5IjoiMDFLMjlCSERNVlFXUVpaQ0NKWjY4U0c4RFMiLCJ0ZW5hbnRfaWQiOiJiZDA5ZmE1N2Y4OTE1NjJlYmQ4OTNiM2ZhZjVmODMyZDg0N2YzOTZlMmYzOWU2MDA4NDA1NDlhNWI2MDk5Mzc4IiwiaW50ZXJuYWxfc2VjcmV0IjoiZTFjOGI3YzItMmE0MC00MDE4LWJkMTctOWZmMWFjNzA2NDc2In0.fSm5jzX6OhojytKxTMCdyFKASgiZSOvUZJtC1WFRTIQ
set HOST=0.0.0.0
set PORT=3001
set BASE_URL=http://localhost:3001
set ADMIN_EMAIL=admin@gmail.com
set ADMIN_PASSWORD=admin@123
set JWT_SECRET=your-jwt-secret-here
echo Environment variables set!

echo.
echo Step 4: Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Failed to generate Prisma client
    pause
    exit /b 1
)
echo Prisma client generated!

echo.
echo Step 5: Deploying schema to Prisma Console...
call npx prisma migrate deploy
echo Schema deployed to Prisma Console!

echo.
echo Step 6: Seeding database in Prisma Console...
call npm run db:seed
echo Database seeded in Prisma Console!

echo.
echo Setup complete!
echo.
echo Your application is ready to run locally
echo Data will be stored in Prisma Console (cloud)
echo No local database needed
echo.
echo To start your application locally:
echo   npm run start:dev
echo.
echo Your application will be available at: http://localhost:3001
echo.
pause
