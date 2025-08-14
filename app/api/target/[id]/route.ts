import { NextRequest, NextResponse } from 'next/server';
import { targetService } from '@/lib/db/target';

// GET target by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const target = await targetService.getById(id);

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Target not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: target
    });

  } catch (error) {
    console.error('Error fetching target:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch target' },
      { status: 500 }
    );
  }
}

// PUT update target
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Update the target
    const updatedTarget = await targetService.update(id, {
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
      data: updatedTarget,
      message: 'Target updated successfully'
    });

  } catch (error) {
    console.error('Error updating target:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update target' },
      { status: 500 }
      );
  }
}

// DELETE target
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedTarget = await targetService.delete(id);

    return NextResponse.json({
      success: true,
      data: deletedTarget,
      message: 'Target deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting target:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete target' },
      { status: 500 }
    );
  }
}
