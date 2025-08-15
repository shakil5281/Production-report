# Role-Based Access Control (RBAC) System

## Overview

This production management application now features a comprehensive Role-Based Access Control (RBAC) system that allows granular control over user permissions and access to different parts of the application.

## User Roles

### 1. Super Admin
- **Full system access** with complete control over all features
- **User management** - Can create, edit, and delete users
- **System settings** - Can configure system parameters
- **All permissions** - Has access to every feature in the system

### 2. Admin
- **Full feature access** except user management
- Can manage all production, cutting, cashbook, and report features
- Cannot create or delete users (only Super Admin can)

### 3. Manager
- **Read/Update access** to most features
- Can view and update production data
- Can create and update reports
- Cannot delete critical data

### 4. Specialized Managers

#### Cashbook Manager
- **Full access** to cashbook and expense management
- Can create, read, update, and delete cashbook entries
- Can manage all expense-related data
- **Read-only access** to reports

#### Production Manager
- **Full access** to production, targets, and line management
- Can create, read, update, and delete production data
- Can manage production targets and line assignments
- **Read-only access** to reports

#### Cutting Manager
- **Full access** to cutting management
- Can create, read, update, and delete cutting data
- **Read-only access** to production and reports

### 5. Report Viewer
- **Read-only access** to all reports and data
- Cannot create, update, or delete any data
- Perfect for supervisors who need to monitor but not modify

### 6. User
- **Basic access** to view production data and reports
- Limited permissions for general users

## Features

### User Management (Super Admin Only)
- Create new users with specific roles
- Edit user information and roles
- Activate/deactivate user accounts
- Delete users
- View user activity and permissions

### Permission System
- Granular permissions for each feature area
- Automatic role-based permission assignment
- Custom permission overrides per user
- Permission inheritance based on roles

### Security Features
- JWT-based authentication
- Session management
- Password hashing with bcrypt
- Role-based route protection
- API endpoint security
- Page-level access control

## Technical Implementation

### Database Schema
- **Users** - User accounts and roles
- **Permissions** - Individual permission types
- **Roles** - Role definitions
- **UserPermissions** - Direct user permissions
- **RolePermissions** - Role-based permissions
- **Sessions** - User session management

### API Protection
- Middleware for role-based API protection
- Permission checking decorators
- Automatic unauthorized access handling

### UI Components
- Role-based navigation filtering
- Permission-based component rendering
- Read-only mode for restricted users
- Access denied pages with clear messaging

## Setup Instructions

### 1. Database Migration
```bash
# Run the database migration
yarn prisma db push
```

### 2. Setup RBAC System
```bash
# Setup permissions and create super admin
node scripts/setup-rbac-system.js

# Setup with demo users for testing
node scripts/setup-rbac-system.js --demo

# Reset database and setup fresh
node scripts/setup-rbac-system.js --reset --demo
```

### 3. Default Credentials
After setup, use these credentials to login:

**Super Admin:**
- Email: `superadmin@production.com`
- Password: `SuperAdmin@123`

**Demo Users (if created):**
- Cashbook Manager: `cashbook@production.com` / `Demo@123`
- Production Manager: `production@production.com` / `Demo@123`
- Cutting Manager: `cutting@production.com` / `Demo@123`
- Report Viewer: `reports@production.com` / `Demo@123`
- Manager: `manager@production.com` / `Demo@123`

⚠️ **Important:** Change all default passwords after first login!

## Usage Guide

### For Super Admin
1. Login with super admin credentials
2. Navigate to **Administration > User Management**
3. Create users for your team with appropriate roles
4. Monitor user activity and permissions
5. Configure system settings as needed

### For Regular Users
1. Login with your assigned credentials
2. Your navigation will show only features you have access to
3. Some features may be read-only based on your role
4. Contact your administrator if you need additional access

## Permission Matrix

| Feature | Super Admin | Admin | Manager | Cashbook Mgr | Production Mgr | Cutting Mgr | Report Viewer | User |
|---------|-------------|-------|---------|--------------|----------------|-------------|---------------|------|
| User Management | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Production | ✅ Full | ✅ Full | 📖 Read/Update | ❌ | ✅ Full | 📖 Read | 📖 Read | 📖 Read |
| Cashbook | ✅ Full | ✅ Full | 📖 Read | ✅ Full | ❌ | ❌ | 📖 Read | ❌ |
| Cutting | ✅ Full | ✅ Full | 📖 Read | ❌ | ❌ | ✅ Full | 📖 Read | ❌ |
| Expenses | ✅ Full | ✅ Full | 📖 Read | ✅ Full | ❌ | ❌ | 📖 Read | ❌ |
| Reports | ✅ Full | ✅ Full | ✅ Create/Update | 📖 Read | 📖 Read | 📖 Read | 📖 Read | 📖 Read |
| Targets | ✅ Full | ✅ Full | 📖 Read | ❌ | ✅ Full | ❌ | 📖 Read | ❌ |
| Lines | ✅ Full | ✅ Full | 📖 Read | ❌ | ✅ Full | ❌ | 📖 Read | ❌ |

## API Endpoints

### User Management (Super Admin Only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Protected Routes Examples
- `GET /api/production/secure` - Requires READ_PRODUCTION permission
- `POST /api/cashbook/secure` - Requires cashbook manager role or higher
- All admin routes require appropriate permissions

## Security Best Practices

1. **Always change default passwords** after initial setup
2. **Use strong passwords** for all accounts
3. **Regularly review user permissions** and remove unnecessary access
4. **Monitor user activity** through admin dashboard
5. **Keep the system updated** with latest security patches

## Troubleshooting

### Common Issues

1. **User can't access features**
   - Check user role assignment
   - Verify permissions are correctly set
   - Ensure user account is active

2. **API returns 403 Forbidden**
   - User lacks required permissions
   - Check route protection middleware
   - Verify session is valid

3. **Navigation items missing**
   - User role doesn't have access to those features
   - Check sidebar navigation role filtering

### Support
For technical support or questions about the RBAC system, contact your system administrator or development team.

## Development Notes

The RBAC system is built with:
- **Next.js 14** with App Router
- **Prisma** for database management
- **TypeScript** for type safety
- **JWT** for authentication
- **bcrypt** for password hashing
- **Tailwind CSS** for styling

All components are designed to be scalable and maintainable, with clear separation of concerns between authentication, authorization, and business logic.
