import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET detailed manpower summary with comprehensive information
export async function GET(request: NextRequest) {
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
    const dateString = date; // Use the date string directly as it's already in YYYY-MM-DD format

    console.log('🔍 Searching for date:', dateString, 'from input:', date);

    // Get detailed records for the specific date
    let detailedRecords: any[] = [];
    try {
      detailedRecords = await prisma.$queryRaw`
        SELECT 
          id, date, section, subsection, "lineNumber", "itemType", 
          present, absent, leave, others, total, remarks,
          "createdAt", "updatedAt"
        FROM manpower_summary
        WHERE date::date = ${dateString}::date
        ORDER BY 
          CASE "itemType" 
            WHEN 'SECTION' THEN 1 
            WHEN 'SUBSECTION' THEN 2 
            WHEN 'LINE' THEN 3 
            WHEN 'TOTAL' THEN 4 
          END,
          section ASC, subsection ASC, "lineNumber" ASC
      ` as any[];
      
      console.log('📊 Found records:', detailedRecords.length);
    } catch (error) {
      console.error('Error fetching detailed records:', error);
      return NextResponse.json(
        { success: false, error: `Failed to fetch detailed records: ${error}` },
        { status: 500 }
      );
    }

    // Get summary statistics
    let summaryStats: any = {};
    try {
      const statsResult = await prisma.$queryRaw`
        SELECT 
          COUNT(*)::integer as total_records,
          COUNT(DISTINCT section)::integer as total_sections,
          SUM(present)::integer as total_present,
          SUM(absent)::integer as total_absent,
          SUM(leave)::integer as total_leave,
          SUM(others)::integer as total_others,
          SUM(total)::integer as grand_total,
          AVG(present)::numeric as avg_present,
          AVG(absent)::numeric as avg_absent,
          MAX(total)::integer as max_total,
          MIN(total)::integer as min_total
        FROM manpower_summary
        WHERE date::date = ${dateString}::date
      ` as any[];

      summaryStats = statsResult[0] || {
        total_records: 0,
        total_sections: 0,
        total_present: 0,
        total_absent: 0,
        total_leave: 0,
        total_others: 0,
        grand_total: 0,
        avg_present: 0,
        avg_absent: 0,
        max_total: 0,
        min_total: 0
      };
    } catch (error) {
      console.error('Error fetching summary statistics:', error);
      summaryStats = {
        total_records: 0,
        total_sections: 0,
        total_present: 0,
        total_absent: 0,
        total_leave: 0,
        total_others: 0,
        grand_total: 0,
        avg_present: 0,
        avg_absent: 0,
        max_total: 0,
        min_total: 0
      };
    }

    // Get section-wise breakdown
    let sectionBreakdown: any[] = [];
    try {
      sectionBreakdown = await prisma.$queryRaw`
        SELECT 
          section,
          COUNT(*)::integer as records_count,
          SUM(present)::integer as section_present,
          SUM(absent)::integer as section_absent,
          SUM(leave)::integer as section_leave,
          SUM(others)::integer as section_others,
          SUM(total)::integer as section_total,
          COUNT(DISTINCT "itemType")::integer as item_types_count,
          COUNT(DISTINCT subsection)::integer as subsections_count,
          COUNT(DISTINCT "lineNumber")::integer as lines_count
        FROM manpower_summary
        WHERE date::date = ${dateString}::date
        GROUP BY section
        ORDER BY section ASC
      ` as any[];
    } catch (error) {
      console.error('Error fetching section breakdown:', error);
      sectionBreakdown = [];
    }

    // Calculate attendance rate
    const attendanceRate = Number(summaryStats?.grand_total) > 0 
      ? Number(((Number(summaryStats.total_present) / Number(summaryStats.grand_total)) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        records: detailedRecords.map((record: any) => ({
          id: record.id,
          date: record.date.toISOString().split('T')[0],
          section: record.section,
          subsection: record.subsection,
          lineNumber: record.lineNumber,
          itemType: record.itemType,
          present: Number(record.present),
          absent: Number(record.absent),
          leave: Number(record.leave),
          others: Number(record.others),
          total: Number(record.total),
          remarks: record.remarks,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        })),
        summary: {
          totalRecords: Number(summaryStats?.total_records || 0),
          totalDates: 1, // Since we're querying for a specific date
          totalSections: Number(summaryStats?.total_sections || 0),
          totalPresent: Number(summaryStats?.total_present || 0),
          totalAbsent: Number(summaryStats?.total_absent || 0),
          totalLeave: Number(summaryStats?.total_leave || 0),
          totalOthers: Number(summaryStats?.total_others || 0),
          grandTotal: Number(summaryStats?.grand_total || 0),
          attendanceRate,
          averagePresent: Number(Number(summaryStats?.avg_present || 0).toFixed(1)),
          averageAbsent: Number(Number(summaryStats?.avg_absent || 0).toFixed(1)),
          maxTotal: Number(summaryStats?.max_total || 0),
          minTotal: Number(summaryStats?.min_total || 0)
        },
        sectionBreakdown: sectionBreakdown.map((section: any) => ({
          section: section.section,
          recordsCount: Number(section.records_count),
          present: Number(section.section_present),
          absent: Number(section.section_absent),
          leave: Number(section.section_leave),
          others: Number(section.section_others),
          total: Number(section.section_total),
          itemTypesCount: Number(section.item_types_count),
          subsectionsCount: Number(section.subsections_count),
          linesCount: Number(section.lines_count),
          attendanceRate: Number(section.section_total) > 0 
            ? Number(((Number(section.section_present) / Number(section.section_total)) * 100).toFixed(1))
            : 0
        }))
      },
      filters: {
        date
      }
    });

  } catch (error) {
    console.error('Error fetching detailed manpower summary:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch detailed summary: ${error}` },
      { status: 500 }
    );
  }
}