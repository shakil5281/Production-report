@echo off
echo 🚀 Setting up Production Management System Database...

REM Check if .env.local exists
if not exist .env.local (
    echo ❌ .env.local file not found!
    echo Please create .env.local with your database configuration.
    echo You can copy from env.example and update the values.
    pause
    exit /b 1
)

echo ✅ Environment file found

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npx prisma generate

if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo ✅ Prisma client generated successfully

REM Run database migrations
echo 🗄️ Running database migrations...
call npx prisma migrate dev

if %errorlevel% neq 0 (
    echo ❌ Failed to run database migrations
    pause
    exit /b 1
)

echo ✅ Database migrations completed

REM Seed the database
echo 🌱 Seeding database with initial data...
call npx prisma db seed

if %errorlevel% neq 0 (
    echo ❌ Failed to seed database
    pause
    exit /b 1
)

echo ✅ Database seeded successfully

echo.
echo 🎉 Database setup completed successfully!
echo.
echo 📋 Default super admin account:
echo    Email: admin@example.com
echo    Password: Admin123!@#
echo.
echo ⚠️  IMPORTANT: Change the default password immediately!
echo.
echo 🚀 You can now start the development server with:
echo    npm run dev
echo    or
echo    yarn dev
echo.
pause
