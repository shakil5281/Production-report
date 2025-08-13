@echo off
echo Setting up PostgreSQL database for Production Report System
echo.

echo 1. Make sure PostgreSQL is installed and running
echo 2. Create a database named 'production_db'
echo 3. Update your .env.local file with the correct DATABASE_URL
echo.

echo Example DATABASE_URL format:
echo DATABASE_URL="postgresql://username:password@localhost:5432/production_db"
echo.

echo After setting up the database, run:
echo yarn db:generate
echo yarn db:push
echo yarn db:seed
echo.

pause
