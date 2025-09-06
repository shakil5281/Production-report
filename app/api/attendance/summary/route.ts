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

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid date format. Expected YYYY-MM-DD' 
      }, { status: 400 });
    }

    const dateString = date;

    // Fetch manpower records for the specified date
    const manpowerRecords = await prisma.manpowerSummary.findMany({
      where: {
        date: {
          gte: new Date(dateString + 'T00:00:00Z'),
          lte: new Date(dateString + 'T23:59:59Z')
        }
      },
      orderBy: [
        { section: 'asc' },
        { subsection: 'asc' },
        { lineNumber: 'asc' }
      ]
    });

    // Process data to match frontend expectations
    const recordsByDate: Record<string, any[]> = {};
    recordsByDate[dateString] = manpowerRecords;

    // Calculate summary statistics
    const totalPresent = manpowerRecords.reduce((sum, record) => sum + record.present, 0);
    const totalAbsent = manpowerRecords.reduce((sum, record) => sum + record.absent, 0);
    const totalLeave = manpowerRecords.reduce((sum, record) => sum + record.leave, 0);
    const totalOthers = manpowerRecords.reduce((sum, record) => sum + record.others, 0);
    const grandTotal = manpowerRecords.reduce((sum, record) => sum + record.total, 0);
    
    const attendanceRate = grandTotal > 0 ? (totalPresent / grandTotal) * 100 : 0;

    const summary = {
      totalPresent,
      totalAbsent,
      totalLeave,
      totalOthers,
      grandTotal,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      dates: 1,
      sections: new Set(manpowerRecords.map(r => r.section)).size
    };

    const responseData = {
      records: recordsByDate,
      summary
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error in attendance summary API:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('Invalid date')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid date provided' 
        }, { status: 400 });
      }
      
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Database connection error. Please try again later.' 
        }, { status: 503 });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error. Please try again later.' 
    }, { status: 500 });
  }
}