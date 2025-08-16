import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/production/daily-reports - Get daily production reports
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const styleNo = searchParams.get('styleNo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;
    const reportDate = new Date(date + 'T00:00:00Z');

    let whereClause: any = {
      date: {
        gte: new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate()),
        lt: new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate() + 1),
      }
    };

    if (styleNo) {
      whereClause.styleNo = styleNo;
    }

    const [reports, total] = await Promise.all([
      prisma.dailyProductionReport.findMany({
        where: whereClause,
        include: {
          productionList: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dailyProductionReport.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching daily production reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily production reports' },
      { status: 500 }
    );
  }
}

// POST /api/production/daily-reports - Create daily production report
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      date, 
      styleNo, 
      targetQty, 
      productionQty, 
      lineNo, 
      notes 
    } = body;

    // Validation
    if (!date || !styleNo || !targetQty || !productionQty) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: date, styleNo, targetQty, productionQty' },
        { status: 400 }
      );
    }

    if (targetQty <= 0 || productionQty < 0) {
      return NextResponse.json(
        { success: false, error: 'Target quantity must be positive, production quantity cannot be negative' },
        { status: 400 }
      );
    }

    // Get production list to fetch price
    const productionList = await prisma.productionList.findUnique({
      where: { styleNo },
    });

    if (!productionList) {
      return NextResponse.json(
        { success: false, error: 'Production style not found' },
        { status: 404 }
      );
    }

    const unitPrice = productionList.price;
    const totalAmount = productionQty * parseFloat(unitPrice.toString()) * 120;

    // Check if report already exists for this date and style
    const reportDate = new Date(date);
    const existingReport = await prisma.dailyProductionReport.findUnique({
      where: {
        date_styleNo: {
          date: reportDate,
          styleNo,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'Report already exists for this date and style' },
        { status: 409 }
      );
    }

    // Get or create production balance
    let balance = await prisma.productionBalance.findUnique({
      where: { styleNo },
    });

    if (!balance) {
      balance = await prisma.productionBalance.create({
        data: {
          styleNo,
          totalTarget: targetQty,
          totalProduced: productionQty,
          currentBalance: targetQty - productionQty,
        },
      });
    } else {
      // Update balance: add new target, add new production, calculate new balance
      const newTotalTarget = balance.totalTarget + targetQty;
      const newTotalProduced = balance.totalProduced + productionQty;
      const newBalance = newTotalTarget - newTotalProduced;

      balance = await prisma.productionBalance.update({
        where: { styleNo },
        data: {
          totalTarget: newTotalTarget,
          totalProduced: newTotalProduced,
          currentBalance: newBalance,
          lastUpdated: new Date(),
        },
      });
    }

    // Create daily report
    const report = await prisma.dailyProductionReport.create({
      data: {
        date: reportDate,
        styleNo,
        targetQty,
        productionQty,
        unitPrice,
        totalAmount,
        balanceQty: balance.currentBalance,
        lineNo,
        notes,
      },
      include: {
        productionList: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Daily production report created successfully',
    });
  } catch (error) {
    console.error('Error creating daily production report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create daily production report' },
      { status: 500 }
    );
  }
}
