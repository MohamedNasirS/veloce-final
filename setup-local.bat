@echo off
echo Setting up Veloce application for local development...

echo.
echo Step 1: Checking if PostgreSQL is installed...
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo PostgreSQL is not installed or not in PATH.
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo Then add PostgreSQL bin directory to your PATH environment variable.
    pause
    exit /b 1
)

echo PostgreSQL found!

echo.
echo Step 2: Creating local database...
echo Please enter your PostgreSQL password when prompted:
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
echo Step 3: Creating environment file...
if not exist "backend\.env" (
    echo DATABASE_URL="postgresql://veloce_user:veloce_password@localhost:5432/veloce" > backend\.env
    echo HOST=0.0.0.0 >> backend\.env
    echo PORT=3001 >> backend\.env
    echo BASE_URL=http://localhost:3001 >> backend\.env
    echo ADMIN_EMAIL=admin@gmail.com >> backend\.env
    echo ADMIN_PASSWORD=admin@123 >> backend\.env
    echo JWT_SECRET=your-jwt-secret-here >> backend\.env
    echo Environment file created!
) else (
    echo Environment file already exists.
)

echo.
echo Step 4: Installing dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Step 5: Setting up database...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Failed to generate Prisma client.
    pause
    exit /b 1
)

echo Running database migrations...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo Migration failed. Trying to reset...
    call npx prisma migrate reset --force
    call npx prisma migrate dev --name init
)

echo Seeding database...
call npm run db:seed

echo.
echo Setup complete!
echo.
echo To start the application in development mode, run:
echo   cd backend
echo   npm run start:dev
echo.
echo The application will be available at: http://localhost:3001
echo.
pause
