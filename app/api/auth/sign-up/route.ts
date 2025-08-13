import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/auth';
import { PrismaClient, UserRole, PermissionType } from '@prisma/client';

const prisma = new PrismaClient();

// Validation schema for sign-up
const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Create user with default role (USER)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.USER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Create default user permissions based on role
    await createDefaultUserPermissions(newUser.id, UserRole.USER);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    }, { status: 201 });

  } catch (error) {
    console.error('Sign-up error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function createDefaultUserPermissions(userId: string, role: UserRole) {
  try {
    // Get default permissions for the role
    const defaultPermissions = await getDefaultPermissionsForRole(role);
    
    // Create user permissions
    const userPermissions = defaultPermissions.map(permissionId => ({
      userId,
      permissionId,
      granted: true,
    }));

    await prisma.userPermission.createMany({
      data: userPermissions,
    });
  } catch (error) {
    console.error('Error creating default user permissions:', error);
    // Don't throw error here as user creation should still succeed
  }
}

async function getDefaultPermissionsForRole(role: UserRole): Promise<string[]> {
  // Define default permissions for each role
  const rolePermissions = {
    [UserRole.USER]: [
      'READ_PRODUCTION',
      'READ_REPORT',
    ],
    [UserRole.MANAGER]: [
      'READ_PRODUCTION',
      'UPDATE_PRODUCTION',
      'CREATE_REPORT',
      'READ_REPORT',
      'UPDATE_REPORT',
    ],
    [UserRole.ADMIN]: [
      'CREATE_PRODUCTION',
      'READ_PRODUCTION',
      'UPDATE_PRODUCTION',
      'DELETE_PRODUCTION',
      'CREATE_REPORT',
      'READ_REPORT',
      'UPDATE_REPORT',
      'DELETE_REPORT',
      'CREATE_USER',
      'READ_USER',
      'UPDATE_USER',
    ],
    [UserRole.SUPER_ADMIN]: [
      'CREATE_PRODUCTION',
      'READ_PRODUCTION',
      'UPDATE_PRODUCTION',
      'DELETE_PRODUCTION',
      'CREATE_REPORT',
      'READ_REPORT',
      'UPDATE_REPORT',
      'DELETE_REPORT',
      'CREATE_USER',
      'READ_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'MANAGE_SYSTEM',
      'MANAGE_ROLES',
      'MANAGE_PERMISSIONS',
    ],
  };

  const permissions = rolePermissions[role] || [];
  
  // Get permission IDs from database
  const permissionRecords = await prisma.permissionModel.findMany({
    where: {
      name: {
        in: permissions as PermissionType[],
      },
    },
    select: { id: true },
  });

  return permissionRecords.map(p => p.id);
}
