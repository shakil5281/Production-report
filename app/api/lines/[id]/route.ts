import { NextRequest, NextResponse } from 'next/server';
import { linesService } from '@/lib/db/lines';

// GET line by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const line = await linesService.getById(id);

    if (!line) {
      return NextResponse.json(
        { success: false, error: 'Line not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: line
    });

  } catch (error) {
    console.error('Error fetching line:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch line' },
      { status: 500 }
    );
  }
}

// PUT update line
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, code, isActive } = body;

    // Validation
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Update the line
    const updatedLine = await linesService.update(id, {
      name,
      code,
      isActive
    });

    return NextResponse.json({
      success: true,
      data: updatedLine,
      message: 'Line updated successfully'
    });

  } catch (error) {
    console.error('Error updating line:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update line' },
      { status: 500 }
    );
  }
}

// DELETE line
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deletedLine = await linesService.delete(id);

    return NextResponse.json({
      success: true,
      data: deletedLine,
      message: 'Line deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting line:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete line' },
      { status: 500 }
    );
  }
}
