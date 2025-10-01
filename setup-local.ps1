Write-Host "Setting up Veloce application for local development..." -ForegroundColor Green

Write-Host "`nStep 1: Checking if PostgreSQL is installed..." -ForegroundColor Yellow
try {
    $psqlPath = Get-Command psql -ErrorAction Stop
    Write-Host "PostgreSQL found at: $($psqlPath.Source)" -ForegroundColor Green
} catch {
    Write-Host "PostgreSQL is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Then add PostgreSQL bin directory to your PATH environment variable." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 2: Creating local database..." -ForegroundColor Yellow
Write-Host "Please enter your PostgreSQL password when prompted:" -ForegroundColor Cyan

try {
    psql -U postgres -c "CREATE DATABASE veloce;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Database might already exist, continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating database. Please check your PostgreSQL connection." -ForegroundColor Red
}

try {
    psql -U postgres -c "CREATE USER veloce_user WITH PASSWORD 'veloce_password';" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "User might already exist, continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating user. Please check your PostgreSQL connection." -ForegroundColor Red
}

try {
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE veloce TO veloce_user;" 2>$null
} catch {
    Write-Host "Error granting privileges. Please check your PostgreSQL connection." -ForegroundColor Red
}

Write-Host "`nStep 3: Creating environment file..." -ForegroundColor Yellow
$envPath = "backend\.env"
if (!(Test-Path $envPath)) {
    $envContent = @"
DATABASE_URL="postgresql://veloce_user:veloce_password@localhost:5432/veloce"
HOST=0.0.0.0
PORT=3001
BASE_URL=http://localhost:3001
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin@123
JWT_SECRET=your-jwt-secret-here
"@
    Set-Content -Path $envPath -Value $envContent
    Write-Host "Environment file created!" -ForegroundColor Green
} else {
    Write-Host "Environment file already exists." -ForegroundColor Yellow
}

Write-Host "`nStep 4: Installing dependencies..." -ForegroundColor Yellow
Set-Location backend
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install dependencies"
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to install dependencies." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`nStep 5: Setting up database..." -ForegroundColor Yellow
try {
    Write-Host "Generating Prisma client..." -ForegroundColor Cyan
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to generate Prisma client"
    }

    Write-Host "Running database migrations..." -ForegroundColor Cyan
    npx prisma migrate dev --name init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Migration failed. Trying to reset..." -ForegroundColor Yellow
        npx prisma migrate reset --force
        npx prisma migrate dev --name init
    }

    Write-Host "Seeding database..." -ForegroundColor Cyan
    npm run db:seed
    
    Write-Host "`nSetup complete!" -ForegroundColor Green
    Write-Host "`nTo start the application in development mode, run:" -ForegroundColor Cyan
    Write-Host "  npm run start:dev" -ForegroundColor White
    Write-Host "`nThe application will be available at: http://localhost:3001" -ForegroundColor Green
    
} catch {
    Write-Host "Database setup failed: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "`nPress Enter to continue"
