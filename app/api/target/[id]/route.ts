import { NextRequest, NextResponse } from 'next/server';
import { targetService } from '@/lib/db/target';
import { DailyProductionService } from '@/lib/services/daily-production-service';

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

    // Get the current target for comparison
    const currentTarget = await targetService.getById(id);
    if (!currentTarget) {
      return NextResponse.json(
        { success: false, error: 'Target not found' },
        { status: 404 }
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

    // Update daily production report
    try {
      await DailyProductionService.handleTargetProduction({
        targetId: updatedTarget.id,
        styleNo: updatedTarget.styleNo,
        lineNo: updatedTarget.lineNo,
        dateString: date, // Pass original date string to avoid double timezone conversion
        hourlyProduction: updatedTarget.hourlyProduction,
        lineTarget: updatedTarget.lineTarget,
        action: 'UPDATE'
      });
    } catch (error) {
      console.warn('Failed to update daily production report:', error);
      // Continue with target update even if daily report fails
    }

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
    
    // Get the target before deletion for daily production tracking
    const targetToDelete = await targetService.getById(id);
    if (!targetToDelete) {
      return NextResponse.json(
        { success: false, error: 'Target not found' },
        { status: 404 }
      );
    }

    // Delete the target
    const deletedTarget = await targetService.delete(id);

    // Update daily production report to subtract the production
    try {
      // For DELETE, we need to reconstruct the original date string from the stored date
      // Since the stored date is already timezone-converted, we extract the local date parts
      const storedDate = new Date(deletedTarget.date);
      const year = storedDate.getFullYear();
      const month = String(storedDate.getMonth() + 1).padStart(2, '0');
      const day = String(storedDate.getDate()).padStart(2, '0');
      const originalDateString = `${year}-${month}-${day}`;
      
      await DailyProductionService.handleTargetProduction({
        targetId: deletedTarget.id,
        styleNo: deletedTarget.styleNo,
        lineNo: deletedTarget.lineNo,
        dateString: originalDateString, // Pass reconstructed date string
        hourlyProduction: deletedTarget.hourlyProduction,
        lineTarget: deletedTarget.lineTarget,
        action: 'DELETE'
      });
    } catch (error) {
      console.warn('Failed to update daily production report:', error);
      // Continue with target deletion even if daily report fails
    }

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
