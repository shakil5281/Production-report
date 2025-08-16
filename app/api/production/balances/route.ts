import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/production/balances - Get production balances
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const styleNo = searchParams.get('styleNo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (styleNo) {
      whereClause.styleNo = styleNo;
    }

    const [balances, total] = await Promise.all([
      prisma.productionBalance.findMany({
        where: whereClause,
        include: {
          productionList: true,
        },
        orderBy: { lastUpdated: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productionBalance.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: balances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching production balances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch production balances' },
      { status: 500 }
    );
  }
}

// PUT /api/production/balances - Update production balance
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { styleNo, productionQty } = body;

    // Validation
    if (!styleNo || productionQty === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: styleNo, productionQty' },
        { status: 400 }
      );
    }

    if (productionQty < 0) {
      return NextResponse.json(
        { success: false, error: 'Production quantity cannot be negative' },
        { status: 400 }
      );
    }

    // Get existing balance
    const existingBalance = await prisma.productionBalance.findUnique({
      where: { styleNo },
    });

    if (!existingBalance) {
      return NextResponse.json(
        { success: false, error: 'Production balance not found for this style' },
        { status: 404 }
      );
    }

    // Update balance
    const newTotalProduced = existingBalance.totalProduced + productionQty;
    const newBalance = existingBalance.totalTarget - newTotalProduced;

    const updatedBalance = await prisma.productionBalance.update({
      where: { styleNo },
      data: {
        totalProduced: newTotalProduced,
        currentBalance: newBalance,
        lastUpdated: new Date(),
      },
      include: {
        productionList: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBalance,
      message: 'Production balance updated successfully',
    });
  } catch (error) {
    console.error('Error updating production balance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update production balance' },
      { status: 500 }
    );
  }
}
