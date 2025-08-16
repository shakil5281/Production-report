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
    
    // Log the raw request for debugging
        let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body',
          details: jsonError instanceof Error ? jsonError.message : 'JSON parse error'
        },
        { status: 400 }
      );
    }
    
    const { lineNo, styleNo, lineTarget, date, inTime, outTime, hourlyProduction } = body;



    // Validation - check if all required fields are present
    const requiredFields = { lineNo, styleNo, lineTarget, date, inTime, outTime };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => value === undefined || value === null || value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          receivedData: body,
          requiredFields: ['lineNo', 'styleNo', 'lineTarget', 'date', 'inTime', 'outTime']
        },
        { status: 400 }
      );
    }

    // Validate numeric values
    const lineTargetNum = Number(lineTarget);
    const hourlyProductionNum = Number(hourlyProduction) || 0;

    if (isNaN(lineTargetNum) || lineTargetNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'lineTarget must be a positive number' },
        { status: 400 }
      );
    }

    if (isNaN(hourlyProductionNum) || hourlyProductionNum < 0) {
      return NextResponse.json(
        { success: false, error: 'hourlyProduction must be a non-negative number' },
        { status: 400 }
      );
    }

    // Update the target
    const updatedTarget = await targetService.update(id, {
      lineNo,
      styleNo,
      lineTarget: lineTargetNum,
      date,
      inTime,
      outTime,
      hourlyProduction: hourlyProductionNum
    });

    return NextResponse.json({
      success: true,
      data: updatedTarget,
      message: 'Target updated successfully'
    });

  } catch (error) {
    console.error('Error updating target:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message || 'Failed to update target',
        details: error instanceof Error ? error.stack : 'No stack trace'
      },
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
