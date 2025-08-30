import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET detailed manpower summary with comprehensive information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Date parameter is required' 
      }, { status: 400 });
    }

    const dateString = date;

    // Fetch detailed manpower records for the specified date
    const detailedRecords = await prisma.manpowerSummary.findMany({
      where: {
        date: dateString
      },
      orderBy: [
        { section: 'asc' },
        { subsection: 'asc' },
        { lineNumber: 'asc' }
      ]
    });

    if (detailedRecords.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No detailed manpower records found for the specified date'
      });
    }

    return NextResponse.json({
      success: true,
      data: detailedRecords
    });

  } catch (error) {
    console.error('Error in manpower details API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}