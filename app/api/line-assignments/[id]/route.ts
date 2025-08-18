import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/line-assignments/[id] - Get assignment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const assignment = await prisma.styleAssignment.findUnique({
      where: { id },
      include: {
        line: true,
        style: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PUT /api/line-assignments/[id] - Update assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { startDate, endDate, targetPerHour } = body;

    // Check if assignment exists
    const existingAssignment = await prisma.styleAssignment.findUnique({
      where: { id },
      include: { line: true, style: true }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Validate dates if provided
    let start, end;
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid start date' },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid end date' },
          { status: 400 }
        );
      }
    }

    if (start && end && end <= start) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping assignments if dates are being changed
    if (start || end) {
      const finalStart = start || existingAssignment.startDate;
      const finalEnd = end || existingAssignment.endDate;

      const overlappingAssignment = await prisma.styleAssignment.findFirst({
        where: {
          id: { not: id }, // Exclude current assignment
          lineId: existingAssignment.lineId,
          startDate: { lte: finalEnd || new Date('2099-12-31') },
          OR: [
            { endDate: null },
            { endDate: { gte: finalStart } }
          ]
        }
      });

      if (overlappingAssignment) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Updated dates would conflict with another assignment on this line' 
          },
          { status: 409 }
        );
      }
    }

    // Update the assignment
    const updatedAssignment = await prisma.styleAssignment.update({
      where: { id },
      data: {
        ...(startDate && { startDate: start }),
        ...(endDate !== undefined && { endDate: end }),
        ...(targetPerHour !== undefined && { targetPerHour })
      },
      include: {
        line: true,
        style: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedAssignment,
      message: 'Assignment updated successfully'
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/line-assignments/[id] - Delete assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if assignment exists
    const existingAssignment = await prisma.styleAssignment.findUnique({
      where: { id }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Delete the assignment
    await prisma.styleAssignment.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
