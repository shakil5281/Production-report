import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validationResult = loginSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: validationResult.error.issues 
      },
      { status: 400 }
    );
  }

  const { email, password } = validationResult.data;

  try {
    const authService = new AuthService();
    const user = await authService.authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create response with user data (excluding password)
    const { token, ...userWithoutToken } = user;
    
    const response = NextResponse.json({
      message: 'Sign-in successful',
      user: userWithoutToken,
    });

    // Set JWT token as an HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during sign-in.' },
      { status: 500 }
    );
  }
}
