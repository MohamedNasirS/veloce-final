# Quick Local Setup Guide

## 🚀 Fastest Way to Run Locally

### Option 1: Automated Setup (Windows)
```powershell
# Run the PowerShell setup script
.\setup-local.ps1
```

### Option 2: Manual Setup (Step by Step)

#### 1. Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember your `postgres` user password

#### 2. Create Database
```sql
-- Open Command Prompt and run:
psql -U postgres

-- Then in PostgreSQL console:
CREATE DATABASE veloce;
CREATE USER veloce_user WITH PASSWORD 'veloce_password';
GRANT ALL PRIVILEGES ON DATABASE veloce TO veloce_user;
\q
```

#### 3. Create Environment File
Create `backend\.env` with this content:
```env
DATABASE_URL="postgresql://veloce_user:veloce_password@localhost:5432/veloce"
HOST=0.0.0.0
PORT=3001
BASE_URL=http://localhost:3001
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin@123
JWT_SECRET=your-jwt-secret-here
```

#### 4. Setup and Start
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```

## ✅ Verification

1. **Check if server starts**: Look for "Application is running on: http://localhost:3001"
2. **Test database**: The application should connect without errors
3. **Check data**: Visit `http://localhost:3001` to see if API is working

## 🐛 Common Issues

### PostgreSQL not found:
- Add PostgreSQL bin directory to your PATH
- Or use full path: `"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres`

### Database connection failed:
- Check if PostgreSQL service is running
- Verify username/password in .env file
- Make sure database `veloce` exists

### Migration errors:
```bash
npx prisma migrate reset --force
npx prisma migrate dev --name init
```

## 🎯 Next Steps

Once local setup works:
1. Test your application thoroughly
2. Then deploy to Docker using the updated configuration
3. Your data will now persist in Docker containers!

## 📞 Need Help?

Run this to check your setup:
```bash
cd backend
npx prisma studio  # Opens database GUI
```
