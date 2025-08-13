# Production Management System with Role-Based Authentication

A comprehensive production management system built with Next.js 15, Prisma, and shadcn/ui, featuring robust role-based access control and authentication.

## Features

- 🔐 **Secure Authentication System**
  - JWT-based authentication with HTTP-only cookies
  - Password hashing with bcrypt
  - Session management with database storage
  - Automatic token expiration and cleanup

- 👥 **Role-Based Access Control (RBAC)**
  - Four user roles: SUPER_ADMIN, ADMIN, MANAGER, USER
  - Granular permissions for different operations
  - Permission-based UI rendering
  - Route-level access control

- 🛡️ **Security Features**
  - Middleware-based route protection
  - Input validation with Zod schemas
  - SQL injection prevention with Prisma
  - XSS protection with proper escaping
  - CSRF protection with secure cookies

- 🎨 **Modern UI/UX**
  - Beautiful authentication pages
  - Responsive design with Tailwind CSS
  - shadcn/ui components for consistency
  - Loading states and error handling
  - Password strength indicators

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, bcrypt, custom session management
- **Validation**: Zod schemas
- **Forms**: React Hook Form with validation

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd production
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/production_db"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   yarn db:generate
   
   # Run database migrations
   yarn db:migrate
   
   # Seed the database with initial data
   yarn db:seed
   ```

5. **Start the development server**
   ```bash
   yarn dev
   ```

## Database Schema

The system includes the following main entities:

- **Users**: User accounts with roles and authentication
- **Roles**: User roles (SUPER_ADMIN, ADMIN, MANAGER, USER)
- **Permissions**: Granular permissions for different operations
- **RolePermissions**: Many-to-many relationship between roles and permissions
- **UserPermissions**: User-specific permission overrides
- **Sessions**: User authentication sessions

## User Roles and Permissions

### SUPER_ADMIN
- Full system access
- User management (CRUD)
- Role and permission management
- System configuration

### ADMIN
- Production management (CRUD)
- Report management (CRUD)
- User management (CRUD, no deletion)
- Limited system access

### MANAGER
- Production viewing and updates
- Report creation and management
- Limited user access

### USER
- Basic production viewing
- Basic report viewing
- No administrative functions

## API Endpoints

### Authentication
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/me` - Get current user

### Protected Routes
All routes except authentication endpoints require valid authentication tokens.

## Usage Examples

### Using Permission Guards

```tsx
import { PermissionGuard, AdminOrHigher, HasPermission } from '@/components/auth/permission-guard';
import { PermissionType } from '@/lib/types/auth';

// Check specific permission
<HasPermission user={user} permission={PermissionType.CREATE_USER}>
  <CreateUserButton />
</HasPermission>

// Check role level
<AdminOrHigher user={user}>
  <AdminPanel />
</AdminOrHigher>

// Custom permission check
<PermissionGuard 
  user={user} 
  requiredRoles={[UserRole.MANAGER, UserRole.ADMIN]}
  mode="any"
>
  <ManagerContent />
</PermissionGuard>
```

### Middleware Protection

The middleware automatically protects routes based on user roles and permissions. Protected routes are defined in `middleware.ts`.

## Security Considerations

1. **JWT Secret**: Always use a strong, unique JWT secret in production
2. **HTTPS**: Use HTTPS in production to protect cookies and tokens
3. **Password Policy**: Enforce strong password requirements
4. **Rate Limiting**: Implement rate limiting for authentication endpoints
5. **Session Cleanup**: Regular cleanup of expired sessions
6. **Input Validation**: All inputs are validated with Zod schemas

## Development

### Database Changes
```bash
# Create a new migration
yarn db:migrate --name description

# Reset database (development only)
yarn db:push --force-reset

# View database in Prisma Studio
yarn db:studio
```

### Adding New Permissions
1. Add the permission to the `PermissionType` enum in `prisma/schema.prisma`
2. Update the seed file to include the new permission
3. Assign permissions to appropriate roles
4. Run `yarn db:migrate` and `yarn db:seed`

## Default Super Admin Account

After running the seed script, a default super admin account is created:
- **Email**: admin@example.com
- **Password**: Admin123!@#

**⚠️ Important**: Change this password immediately in production!

## Error Handling

The system includes comprehensive error handling:
- Validation errors with detailed messages
- Authentication errors with proper HTTP status codes
- Database errors with logging
- User-friendly error messages in the UI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.
