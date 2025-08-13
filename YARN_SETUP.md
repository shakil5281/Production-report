# Yarn Setup Guide for Production Report System

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Yarn** package manager
3. **PostgreSQL** database server

## Installation

### 1. Install Dependencies
```bash
yarn install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker run --name production-postgres \
  -e POSTGRES_DB=production_db \
  -e POSTGRES_USER=production_user \
  -e POSTGRES_PASSWORD=production_password \
  -p 5432:5432 \
  -d postgres:15
```

#### Option B: Local PostgreSQL Installation
1. Install PostgreSQL on your system
2. Create a database named `production_db`
3. Create a user with appropriate permissions

### 3. Environment Configuration

Create a `.env.local` file in the root directory:
```env
# Database Configuration
DATABASE_URL="postgresql://production_user:production_password@localhost:5432/production_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Environment
NODE_ENV="development"
```

### 4. Database Operations

```bash
# Generate Prisma client
yarn db:generate

# Push schema to database
yarn db:push

# Run database migrations (if using migrations)
yarn db:migrate

# Seed the database with initial data
yarn db:seed

# Open Prisma Studio (database GUI)
yarn db:studio
```

### 5. Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linting
yarn lint
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Prisma Client Error**
   - Run `yarn db:generate` after schema changes
   - Restart development server

3. **Permission Errors**
   - Check database user permissions
   - Verify database exists and is accessible

### Reset Database

```bash
# Drop and recreate database
yarn db:push --force-reset

# Or manually in PostgreSQL
DROP DATABASE production_db;
CREATE DATABASE production_db;
```

## Production Deployment

1. Update `DATABASE_URL` with production credentials
2. Set `NODE_ENV=production`
3. Use a strong `JWT_SECRET`
4. Run `yarn build` before deployment
5. Use `yarn start` to run the production server
