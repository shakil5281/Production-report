import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET manpower summary with hierarchical structure
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

    // Fetch manpower records for the specified date
    const manpowerRecords = await prisma.manpowerSummary.findMany({
      where: {
        date: dateString
      },
      orderBy: [
        { section: 'asc' },
        { subsection: 'asc' },
        { lineNumber: 'asc' }
      ]
    });

    if (manpowerRecords.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No manpower records found for the specified date'
      });
    }

    return NextResponse.json({
      success: true,
      data: manpowerRecords
    });

  } catch (error) {
    console.error('Error in attendance summary API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}