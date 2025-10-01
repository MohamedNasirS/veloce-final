@echo off
echo Fixing database schema issue...

REM Set environment variables for local PostgreSQL
set DATABASE_URL=postgresql://veloce_user:veloce_password@localhost:5432/veloce
set HOST=0.0.0.0
set PORT=3001
set BASE_URL=http://localhost:3001
set ADMIN_EMAIL=admin@gmail.com
set ADMIN_PASSWORD=admin@123
set JWT_SECRET=your-jwt-secret-here

echo.
echo Step 1: Creating local database...
psql -U postgres -c "CREATE DATABASE veloce;" 2>nul
if %errorlevel% neq 0 (
    echo Database might already exist, continuing...
)

psql -U postgres -c "CREATE USER veloce_user WITH PASSWORD 'veloce_password';" 2>nul
if %errorlevel% neq 0 (
    echo User might already exist, continuing...
)

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE veloce TO veloce_user;" 2>nul

echo.
echo Step 2: Navigating to backend directory...
cd backend

echo.
echo Step 3: Removing old migration files...
rmdir /s /q prisma\migrations 2>nul
del prisma\dev.db 2>nul

echo.
echo Step 4: Generating Prisma client...
call npx prisma generate

echo.
echo Step 5: Creating fresh migration...
call npx prisma migrate dev --name init

echo.
echo Step 6: Seeding database...
call npm run db:seed

echo.
echo Setup complete!
echo.
echo To start the application:
echo   npm run start:dev
echo.
echo The application will be available at: http://localhost:3001
echo.
pause
