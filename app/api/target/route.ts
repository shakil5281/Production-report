import { NextRequest, NextResponse } from 'next/server';
import { targetService } from '@/lib/db/target';

// GET all targets or targets by date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let targets;
    if (date) {
      targets = await targetService.getByDate(date);
    } else {
      targets = await targetService.getAll();
    }

    return NextResponse.json({
      success: true,
      data: targets,
      total: targets.length
    });
  } catch (error) {
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
