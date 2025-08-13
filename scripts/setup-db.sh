#!/bin/bash

echo "🚀 Setting up Production Management System Database..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your database configuration."
    echo "You can copy from env.example and update the values."
    exit 1
fi

echo "✅ Environment file found"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate dev

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed"
else
    echo "❌ Failed to run database migrations"
    exit 1
fi

# Seed the database
echo "🌱 Seeding database with initial data..."
npx prisma db seed

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully"
else
    echo "❌ Failed to seed database"
    exit 1
fi

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Default super admin account:"
echo "   Email: admin@example.com"
echo "   Password: Admin123!@#"
echo ""
echo "⚠️  IMPORTANT: Change the default password immediately!"
echo ""
echo "🚀 You can now start the development server with:"
echo "   npm run dev"
echo "   or"
echo "   yarn dev"
