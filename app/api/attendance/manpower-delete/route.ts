import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// DELETE manpower summary by date
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Handle date properly to avoid timezone issues
    const dateString = date; // Use the date string directly
    
    console.log('🗑️ Delete API checking for date:', dateString, 'from input:', date);

    // Check if data exists for this date
    let recordCount = 0;
    try {
      const existingRecords = await prisma.$queryRaw`
        SELECT COUNT(*)::integer as count
        FROM manpower_summary
        WHERE date::date = ${dateString}::date
      ` as any[];

      recordCount = Number(existingRecords[0]?.count || 0);
    } catch (error) {
      console.error('Error checking existing records:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing data' },
        { status: 500 }
      );
    }

    if (recordCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found for the specified date' },
        { status: 404 }
      );
    }

    // Get summary before deletion for response
    let summaryBeforeDeletion: any[] = [];
    try {
      summaryBeforeDeletion = await prisma.$queryRaw`
        SELECT 
          section,
          SUM(present)::integer as total_present,
          SUM(absent)::integer as total_absent,
          SUM(leave)::integer as total_leave,
          SUM(others)::integer as total_others,
          SUM(total)::integer as grand_total
        FROM manpower_summary 
        WHERE date::date = ${dateString}::date
        GROUP BY section
        ORDER BY section ASC
      ` as any[];
    } catch (error) {
      console.error('Error getting summary before deletion:', error);
    }

    // Delete all records for the specified date
    try {
      await prisma.$executeRaw`
        DELETE FROM manpower_summary 
        WHERE date::date = ${dateString}::date
      `;
    } catch (error) {
      console.error('Error deleting records:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete records' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        date: dateString,
        deletedRecords: recordCount,
        deletedSummary: summaryBeforeDeletion.map((s: any) => ({
          section: s.section,
          present: Number(s.total_present),
          absent: Number(s.total_absent),
          leave: Number(s.total_leave),
          others: Number(s.total_others),
          total: Number(s.grand_total)
        }))
      },
      message: `Successfully deleted ${recordCount} manpower records for ${dateString}`
    });

  } catch (error) {
    console.error('Error deleting manpower data:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete manpower data: ${error}` },
      { status: 500 }
    );
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
