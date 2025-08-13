#!/bin/bash

echo "========================================"
echo "Production Report System - Quick Start"
echo "========================================"
echo

echo "1. Installing dependencies..."
yarn install

echo
echo "2. Setting up environment..."
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cp env.example .env.local
    echo "Please update .env.local with your database credentials"
else
    echo ".env.local already exists"
fi

echo
echo "3. Database setup instructions:"
echo "   - Make sure PostgreSQL is running"
echo "   - Create a database named 'production_db'"
echo "   - Update DATABASE_URL in .env.local"
echo

echo "4. After database setup, run:"
echo "   yarn db:generate"
echo "   yarn db:push"
echo "   yarn db:seed"
echo

echo "5. Start development server:"
echo "   yarn dev"
echo

read -p "Press Enter to continue..."
