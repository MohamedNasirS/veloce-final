# Prisma Console Setup for Persistent Data Storage

## 🎯 Goal
Set up Prisma Accelerate/Console to store your data in the cloud, ensuring **ZERO data loss** when you rebuild or redeploy your application.

## 📋 Current Status
✅ You already have Prisma Accelerate API key in docker-compose.yml  
❌ Need to properly configure it for cloud database storage  
❌ Need to install Prisma Accelerate extension  

## 🚀 Step-by-Step Setup

### Step 1: Install Prisma Accelerate Extension

```bash
cd backend
npm install @prisma/extension-accelerate
```

### Step 2: Create Prisma Client with Accelerate

Create `backend/src/prisma-accelerate.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

export default prisma
```

### Step 3: Update Your Database URL

Replace your current DATABASE_URL in docker-compose.yml with:

```yaml
- DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_ACCELERATE_API_KEY
```

### Step 4: Update docker-compose.yml

```yaml
version: '3'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - HOST=0.0.0.0
      - PORT=3001
      - BASE_URL=http://backend:3001
      - ADMIN_EMAIL=admin@gmail.com
      - ADMIN_PASSWORD=admin@123
      - DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_ACCELERATE_API_KEY
    networks:
      - veloce-net
    restart: always

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=
    depends_on:
      - backend
    networks:
      - veloce-net
    restart: always

networks:
  veloce-net:
    driver: bridge
```

### Step 5: Remove Local PostgreSQL Service

Since you're using Prisma Console, you don't need the local PostgreSQL service anymore.

## ✅ Benefits of Prisma Console

- 🌐 **Cloud Storage**: Data stored in Prisma's cloud infrastructure
- 🔄 **Zero Data Loss**: Data persists across all rebuilds and redeploys
- ⚡ **Performance**: Connection pooling and caching
- 🔒 **Security**: Encrypted connections and secure API keys
- 📊 **Monitoring**: Built-in database monitoring and analytics
- 🌍 **Global**: Accessible from anywhere

## 🚀 Deployment Commands

```bash
# Build and deploy with Prisma Console
docker-compose up -d

# Your data will now be stored in Prisma Console
# No more data loss on rebuilds!
```

## 🔍 Verification

1. **Check Data Persistence**: Create some test data
2. **Rebuild Container**: `docker-compose down && docker-compose up -d`
3. **Verify Data**: Check that your data is still there
4. **Prisma Studio**: Access your cloud database via Prisma Studio

## 📞 Need Help?

- Visit: https://console.prisma.io/
- Check your Accelerate dashboard for connection status
- Monitor your database usage and performance
