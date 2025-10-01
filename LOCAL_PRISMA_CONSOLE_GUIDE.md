# Local Development with Prisma Console

## 🎯 Goal
Run your application locally on your machine while storing all data in Prisma Console (cloud database).

## ✅ Benefits
- 🏠 **Local Development**: Run on your machine with hot reload
- 🌐 **Cloud Data**: All data stored in Prisma Console
- 🔄 **No Data Loss**: Data persists across all restarts
- ⚡ **Fast Performance**: Optimized cloud database connection
- 🚀 **Easy Setup**: No local database installation needed

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```powershell
.\setup-local-prisma-console.ps1
```

### Option 2: Batch Script
```cmd
setup-local-prisma-console.bat
```

### Option 3: Quick Start (Setup + Run)
```powershell
.\start-local-prisma-console.ps1
```

## 📋 Manual Setup Steps

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Install Prisma Accelerate
```bash
npm install @prisma/extension-accelerate
```

### 3. Set Environment Variables
```bash
# Windows PowerShell
$env:DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
$env:HOST = "0.0.0.0"
$env:PORT = "3001"
$env:BASE_URL = "http://localhost:3001"
$env:ADMIN_EMAIL = "admin@gmail.com"
$env:ADMIN_PASSWORD = "admin@123"
$env:JWT_SECRET = "your-jwt-secret-here"

# Windows CMD
set DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY
set HOST=0.0.0.0
set PORT=3001
set BASE_URL=http://localhost:3001
set ADMIN_EMAIL=admin@gmail.com
set ADMIN_PASSWORD=admin@123
set JWT_SECRET=your-jwt-secret-here
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Deploy Schema to Prisma Console
```bash
npx prisma migrate deploy
```

### 6. Seed Database
```bash
npm run db:seed
```

### 7. Start Application
```bash
npm run start:dev
```

## 🔍 Verification

### Check Application
- Visit: http://localhost:3001
- Should see your API running

### Check Prisma Console
- Visit: https://console.prisma.io/
- Login with your Prisma account
- See your database and data

### Check Prisma Studio
```bash
cd backend
npx prisma studio
```

## 📊 Environment Variables

Your application will use these environment variables:

```env
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY
HOST=0.0.0.0
PORT=3001
BASE_URL=http://localhost:3001
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin@123
JWT_SECRET=your-jwt-secret-here
```

## 🎉 Result

- ✅ Application runs locally on your machine
- ✅ All data stored in Prisma Console (cloud)
- ✅ Hot reload works for development
- ✅ Data persists across restarts
- ✅ No local database installation needed
- ✅ Access data from anywhere via Prisma Console

## 🚨 Troubleshooting

### Connection Issues
- Check your internet connection
- Verify API key is correct
- Check Prisma Console dashboard

### Environment Variables
- Make sure variables are set in the same terminal session
- Restart terminal if needed

### Migration Issues
```bash
npx prisma migrate reset --force
npx prisma migrate deploy
```

## 📞 Support

- Prisma Console: https://console.prisma.io/
- Prisma Docs: https://www.prisma.io/docs/
- Check your Prisma Console dashboard for connection status
