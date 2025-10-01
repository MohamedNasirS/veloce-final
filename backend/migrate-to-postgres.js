const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// This script helps migrate from SQLite to PostgreSQL
async function migrateToPostgres() {
  console.log('Starting migration from SQLite to PostgreSQL...');
  
  try {
    // Initialize Prisma client with PostgreSQL
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/veloce'
        }
      }
    });

    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database');

    // Run migrations
    console.log('🔄 Running database migrations...');
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Generate Prisma client
    console.log('🔄 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Seed database
    console.log('🌱 Seeding database...');
    execSync('npm run db:seed', { stdio: 'inherit' });

    console.log('✅ Migration completed successfully!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateToPostgres();
