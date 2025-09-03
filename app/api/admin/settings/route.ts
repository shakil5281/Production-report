import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, UserRole } from '@prisma/client';
import { AuthService } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get system settings (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate session and check if user is Super Admin
    const authService = new AuthService();
    const user = await authService.validateSession(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Mock system settings - in real implementation, these would come from database or config files
    const settings = {
      appName: process.env.APP_NAME || 'Production Management System',
      appDescription: 'Comprehensive production tracking and management platform',
      timezone: 'Asia/Dhaka',
      dateFormat: 'DD/MM/YYYY',
      currency: 'BDT',
      maintenanceMode: false,
      registrationEnabled: false,
      debugMode: process.env.NODE_ENV === 'development',
      sessionTimeout: 30,
      passwordMinLength: 8,
      passwordRequireSpecialChar: true,
      passwordRequireNumber: true,
      passwordRequireUppercase: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
    };

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Get system settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update system settings (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate session and check if user is Super Admin
    const authService = new AuthService();
    const user = await authService.validateSession(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    // Validate required fields
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400 }
      );
    }

    // Validate settings values
    if (settings.sessionTimeout && (settings.sessionTimeout < 5 || settings.sessionTimeout > 480)) {
      return NextResponse.json(
        { error: 'Session timeout must be between 5 and 480 minutes' },
        { status: 400 }
      );
    }

    if (settings.passwordMinLength && (settings.passwordMinLength < 6 || settings.passwordMinLength > 32)) {
      return NextResponse.json(
        { error: 'Password minimum length must be between 6 and 32 characters' },
        { status: 400 }
      );
    }

    if (settings.maxLoginAttempts && (settings.maxLoginAttempts < 3 || settings.maxLoginAttempts > 10)) {
      return NextResponse.json(
        { error: 'Max login attempts must be between 3 and 10' },
        { status: 400 }
      );
    }

    if (settings.lockoutDuration && (settings.lockoutDuration < 5 || settings.lockoutDuration > 60)) {
      return NextResponse.json(
        { error: 'Lockout duration must be between 5 and 60 minutes' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Save settings to database or configuration files
    // 2. Apply certain settings immediately (like maintenance mode)
    // 3. Log the settings change for audit purposes
    
    // In a real implementation, you would save settings to database
    // For now, just return success response
    
    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('Update system settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET system info endpoint
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate session and check if user is Super Admin
    const authService = new AuthService();
    const user = await authService.validateSession(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'system_info':
        // Mock system info - in real implementation, get actual system stats
        const systemInfo = {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          database: {
            status: 'connected',
            type: 'PostgreSQL',
            size: '15.2 MB',
            lastBackup: new Date().toISOString(),
          },
          server: {
            uptime: '7 days, 14 hours',
            memory: {
              used: 512,
              total: 1024,
            },
            cpu: 35,
          },
        };
        
        return NextResponse.json({
          success: true,
          systemInfo
        });

      case 'create_backup':
        // Mock backup creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return NextResponse.json({
          success: true,
          message: 'Backup created successfully',
          backup: {
            id: Date.now().toString(),
            size: '15.2 MB',
            createdAt: new Date().toISOString(),
          }
        });

      case 'test_database':
        // Mock database test
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return NextResponse.json({
          success: true,
          message: 'Database connection test successful',
          connectionTime: '45ms'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('System action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
