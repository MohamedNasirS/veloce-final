# Local Development Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

## Step 1: Install PostgreSQL Locally

### Windows:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. PostgreSQL will run on `localhost:5432` by default

### macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Or using Postgres.app
# Download from: https://postgresapp.com/
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Local Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE veloce;
CREATE USER veloce_user WITH PASSWORD 'veloce_password';
GRANT ALL PRIVILEGES ON DATABASE veloce TO veloce_user;
\q
```

## Step 3: Setup Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://veloce_user:veloce_password@localhost:5432/veloce"

# Application
HOST=0.0.0.0
PORT=3001
BASE_URL=http://localhost:3001

# Admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=admin@123

# JWT
JWT_SECRET=your-jwt-secret-here
```

## Step 4: Install Dependencies and Setup Database

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database
npm run db:seed
```

## Step 5: Start the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Or production mode
npm run build
npm run start:prod
```

## Step 6: Verify Everything Works

1. Check if the server starts without errors
2. Visit `http://localhost:3001` (if you have API docs)
3. Test database connection by creating a user or bid

## Troubleshooting

### Database Connection Issues:
- Ensure PostgreSQL is running
- Check if the database and user exist
- Verify the DATABASE_URL in your .env file

### Migration Issues:
- If migrations fail, try: `npx prisma migrate reset`
- Then run: `npx prisma migrate dev --name init`

### Port Already in Use:
- Change the PORT in your .env file
- Or kill the process using port 3001

## Quick Commands Reference

```bash
# Database operations
npx prisma migrate dev          # Run migrations
npx prisma migrate reset        # Reset database
npx prisma generate            # Generate client
npx prisma studio              # Open database GUI

# Application
npm run start:dev              # Development mode
npm run build                  # Build for production
npm run start:prod             # Production mode

# Database seeding
npm run db:seed                # Seed database
npm run db:reset               # Reset and seed
```
