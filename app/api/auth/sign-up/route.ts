import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/auth';
import { PrismaClient, UserRole, PermissionType } from '@prisma/client';

const prisma = new PrismaClient();

// Validation schema for sign-up
const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  const body = await request.json();
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

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists.' },
        { status: 409 }
      );
    }

    const authService = new AuthService();
    const hashedPassword = await authService.hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.USER, // Default role
      },
    });

    // Assign default permissions for a new USER role
    const defaultPermissions = await prisma.permissionModel.findMany({
      where: {
        name: {
          in: [
            PermissionType.READ_PRODUCTION,
            PermissionType.CREATE_REPORT,
            PermissionType.READ_REPORT,
          ] as PermissionType[],
        },
      },
    });

    await prisma.userPermission.createMany({
      data: defaultPermissions.map((perm) => ({
        userId: newUser.id,
        permissionId: perm.id,
        granted: true,
      })),
    });

    return NextResponse.json(
      { message: 'User registered successfully', userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sign-up error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during sign-up.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
