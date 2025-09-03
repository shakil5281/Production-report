import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/database/test-import - Test import functionality with sample data
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { tableName, testData } = body;

    if (!tableName || !testData) {
      return NextResponse.json(
        { success: false, error: 'Table name and test data are required' },
        { status: 400 }
      );
    }

    // Test creating a single record
    let result;
    try {
      switch (tableName) {
        case 'factories':
          result = await prisma.factory.create({ data: testData });
          break;
        case 'users':
          result = await prisma.user.create({ data: testData });
          break;
        case 'expenseCategories':
          result = await prisma.expenseCategory.create({ data: testData });
          break;
        default:
          return NextResponse.json(
            { success: false, error: `Unsupported table: ${tableName}` },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully created record in ${tableName}`,
        data: result
      });

    } catch (error) {
      console.error(`Error creating test record in ${tableName}:`, error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          tableName,
          testData,
          error: error instanceof Error ? error.stack : 'No stack trace'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in test import:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test import' },
      { status: 500 }
    );
  }
}
