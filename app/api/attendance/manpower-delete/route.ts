import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// DELETE manpower summary by date
export async function DELETE(request: NextRequest) {
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

    // Delete manpower records for the specified date
    const deleteResult = await prisma.manpowerSummary.deleteMany({
      where: { date: dateString }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} manpower records`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error('Error in manpower delete API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET all available dates with summary counts
export async function GET(request: NextRequest) {
  try {
    // Get all available dates with record counts
    const availableDates = await prisma.$queryRaw`
      SELECT 
        date,
        COUNT(*)::integer as total_records,
        SUM(present)::integer as total_present,
        SUM(absent)::integer as total_absent,
        SUM(leave)::integer as total_leave,
        SUM(others)::integer as total_others,
        SUM(total)::integer as grand_total,
        COUNT(DISTINCT section)::integer as sections_count
      FROM manpower_summary 
      GROUP BY date
      ORDER BY date DESC
    ` as any[];

    return NextResponse.json({
      success: true,
      data: {
        availableDates: availableDates.map((d: any) => ({
          date: d.date.toISOString().split('T')[0],
          totalRecords: Number(d.total_records),
          totalPresent: Number(d.total_present),
          totalAbsent: Number(d.total_absent),
          totalLeave: Number(d.total_leave),
          totalOthers: Number(d.total_others),
          grandTotal: Number(d.grand_total),
          sectionsCount: Number(d.sections_count),
          attendanceRate: Number(d.grand_total) > 0 
            ? Number(((Number(d.total_present) / Number(d.grand_total)) * 100).toFixed(1))
            : 0
        })),
        totalDates: availableDates.length
      }
    });

  } catch (error) {
    console.error('Error fetching available dates:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch available dates: ${error}` },
      { status: 500 }
    );
  }
}
