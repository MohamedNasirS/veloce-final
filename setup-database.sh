#!/bin/bash

echo "Setting up Veloce application database..."

# Remove the old SQLite database file if it exists
if [ -f "backend/prisma/dev.db" ]; then
    echo "Removing old SQLite database file..."
    rm backend/prisma/dev.db
fi

# Remove any existing migration files for SQLite
if [ -d "backend/prisma/migrations" ]; then
    echo "Cleaning up old migration files..."
    rm -rf backend/prisma/migrations
fi

echo "Starting Docker containers..."
docker-compose down -v
docker-compose up -d

echo "Waiting for database to be ready..."
sleep 10

echo "Running database migrations..."
cd backend
npx prisma migrate dev --name init
npx prisma generate

echo "Seeding database..."
npm run db:seed

echo "Setup complete! Your application is now using PostgreSQL with persistent data."
echo "The database will persist across container rebuilds."
