# Quick Start Guide

Get your Production Management System up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Environment Setup
```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your database details
# Update DATABASE_URL and JWT_SECRET
```

### 2. Database Setup
```bash
# On Windows
scripts\setup-db.bat

# On macOS/Linux
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

### 3. Start Development Server
```bash
npm run dev
# or
yarn dev
```

### 4. Access the System
- **URL**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Signup**: http://localhost:3000/signup

## 🔑 Default Admin Account
- **Email**: admin@example.com
- **Password**: Admin123!@#

## 📱 Test the System

1. **Create a new user account** at `/signup`
2. **Login** with your credentials
3. **Explore** the dashboard and features
4. **Test** role-based access control

## 🛠️ Common Issues

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env.local`
- Verify database exists

### Permission Denied
- Run `npx prisma generate` first
- Check if migrations ran successfully
- Ensure database user has proper permissions

### JWT Errors
- Verify JWT_SECRET is set in `.env.local`
- Ensure JWT_SECRET is at least 32 characters

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the [API endpoints](#api-endpoints)
- Customize permissions and roles
- Add your production data

## 🆘 Need Help?

- Check the [README.md](README.md) for comprehensive documentation
- Review the error messages in the console
- Ensure all prerequisites are met
- Verify your environment configuration
