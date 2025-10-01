#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Seed the database if needed
echo "Seeding database..."
npm run db:seed

# Start the application
echo "Starting the application..."
node dist/src/main.js
