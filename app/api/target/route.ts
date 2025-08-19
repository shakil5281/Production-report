import { NextRequest, NextResponse } from 'next/server';
import { targetService } from '@/lib/db/target';
import { DailyProductionService } from '@/lib/services/daily-production-service';

// GET all targets with advanced filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const lineNo = searchParams.get('lineNo');
    const styleNo = searchParams.get('styleNo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filters object
    const filters = {
      date: date || undefined,
      lineNo: lineNo || undefined,
      styleNo: styleNo || undefined,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };

    // Get filtered and paginated targets
    const result = await targetService.getFilteredPaginated({
      filters,
      page,
      limit,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    return NextResponse.json({
      success: true,
      data: result.targets,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      hasMore: page * limit < result.total
    });
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch targets' },
      { status: 500 }
    );
  }
}

// POST new target
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineNo, styleNo, lineTarget, date, inTime, outTime, hourlyProduction } = body;

    // Validation
    if (!lineNo || !styleNo || !lineTarget || !date || !inTime || !outTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (lineTarget <= 0 || hourlyProduction < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid numeric values' },
        { status: 400 }
      );
    }

    // Create new target
    const newTarget = await targetService.create({
      lineNo,
      styleNo,
      lineTarget: Number(lineTarget),
      date,
      inTime,
      outTime,
      hourlyProduction: Number(hourlyProduction) || 0
    });

    // Update daily production report
    try {
      await DailyProductionService.handleTargetProduction({
        targetId: newTarget.id,
        styleNo: newTarget.styleNo,
        lineNo: newTarget.lineNo,
        dateString: date, // Pass original date string to avoid double timezone conversion
        hourlyProduction: newTarget.hourlyProduction,
        lineTarget: newTarget.lineTarget,
        action: 'CREATE'
      });
    } catch (error) {
      console.warn('Failed to update daily production report:', error);
      // Continue with target creation even if daily report fails
    }

    return NextResponse.json({
      success: true,
      data: newTarget,
      message: 'Target created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating target:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create target' },
      { status: 500 }
    );
  }
}
