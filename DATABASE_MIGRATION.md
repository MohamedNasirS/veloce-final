# Database Migration Guide

## Problem
The application was using SQLite with a local file (`file:./dev.db`) which gets lost every time the Docker container is rebuilt.

## Solution
Migrated to PostgreSQL with persistent Docker volumes to ensure data persistence across container rebuilds.

## Changes Made

### 1. Updated Prisma Schema
- Changed from SQLite to PostgreSQL provider
- Updated datasource URL to use environment variable

### 2. Updated Docker Configuration
- Modified `docker-compose.yml` to use proper PostgreSQL connection string
- Added PostgreSQL healthcheck
- Updated service dependencies to wait for database health

### 3. Updated Dockerfile
- Added netcat for database connectivity checks
- Created startup script to handle database initialization
- Added proper migration and seeding on container startup

### 4. Created Migration Scripts
- `setup-database.sh` - Complete setup script
- `backend/migrate-to-postgres.js` - Migration helper script
- `backend/start.sh` - Container startup script with database initialization

## How to Use

### Option 1: Quick Setup (Recommended)
```bash
chmod +x setup-database.sh
./setup-database.sh
```

### Option 2: Manual Setup
```bash
# Stop and remove existing containers
docker-compose down -v

# Remove old SQLite database file
rm backend/prisma/dev.db

# Start the application
docker-compose up -d

# Run migrations (if needed)
cd backend
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

## Data Persistence
- Database data is now stored in a Docker volume (`postgres_data`)
- Data will persist across container rebuilds and restarts
- Volume can be backed up using Docker volume commands

## Environment Variables
The application now uses these environment variables:
- `DATABASE_URL=postgresql://user:password@db:5432/veloce`

## Benefits
✅ Data persists across container rebuilds
✅ Proper database with ACID compliance
✅ Better performance for concurrent operations
✅ Production-ready database setup
✅ Automatic database initialization on startup
