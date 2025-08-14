import { NextRequest, NextResponse } from 'next/server';
import { linesService } from '@/lib/db/lines';

// GET all lines
export async function GET() {
  try {
    const lines = await linesService.getAll();
    return NextResponse.json({
      success: true,
      data: lines,
      total: lines.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch lines' },
      { status: 500 }
    );
  }
}

// POST new line
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code } = body;

    // Validation
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Create new line
    const newLine = await linesService.create({
      name,
      code
    });

    return NextResponse.json({
      success: true,
      data: newLine,
      message: 'Line created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating line:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create line' },
      { status: 500 }
    );
  }
}
