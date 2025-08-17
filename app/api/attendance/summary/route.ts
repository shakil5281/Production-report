import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET manpower summary with hierarchical structure
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');




    // Get all manpower records using raw SQL
    let manpowerRecords: any[] = [];
    
    if (date) {
      // Handle date properly to avoid timezone issues
      const dateString = date; // Use the date string directly as it's already in YYYY-MM-DD format
      
      console.log('🔍 Summary API searching for date:', dateString, 'from input:', date);
      
      manpowerRecords = await prisma.$queryRaw`
        SELECT 
          id, date, section, subsection, "lineNumber", "itemType", 
          present, absent, leave, others, total, remarks,
          "createdAt", "updatedAt"
        FROM manpower_summary
        WHERE date::date = ${dateString}::date
        ORDER BY date DESC, section ASC, subsection ASC, "lineNumber" ASC
      ` as any[];
      
      console.log('📊 Summary API found records:', manpowerRecords.length);
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      manpowerRecords = await prisma.$queryRaw`
        SELECT 
          id, date, section, subsection, "lineNumber", "itemType", 
          present, absent, leave, others, total, remarks,
          "createdAt", "updatedAt"
        FROM manpower_summary
        WHERE date >= ${start} AND date <= ${end}
        ORDER BY date DESC, section ASC, subsection ASC, "lineNumber" ASC
      ` as any[];
    } else {
      manpowerRecords = await prisma.$queryRaw`
        SELECT 
          id, date, section, subsection, "lineNumber", "itemType", 
          present, absent, leave, others, total, remarks,
          "createdAt", "updatedAt"
        FROM manpower_summary
        ORDER BY date DESC, section ASC, subsection ASC, "lineNumber" ASC
      ` as any[];
    }

    // Group records by date for hierarchical display
    const groupedByDate = manpowerRecords.reduce((acc: any, record: any) => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      // Convert database record to expected format
      acc[dateKey].push({
        id: record.id,
        date: dateKey,
        section: record.section,
        subsection: record.subsection,
        lineNumber: record.lineNumber,
        itemType: record.itemType,
        present: Number(record.present),
        absent: Number(record.absent),
        leave: Number(record.leave),
        others: Number(record.others),
        total: Number(record.total),
        remarks: record.remarks
      });
      
      return acc;
    }, {});

    // Calculate overall summary
    const grandTotalRecords = manpowerRecords.filter((r: any) => 
      r.itemType === 'TOTAL' && r.section === 'Grand Total'
    );

    const overallSummary = {
      totalPresent: grandTotalRecords.reduce((sum: number, r: any) => sum + Number(r.present), 0),
      totalAbsent: grandTotalRecords.reduce((sum: number, r: any) => sum + Number(r.absent), 0),
      totalLeave: grandTotalRecords.reduce((sum: number, r: any) => sum + Number(r.leave), 0),
      totalOthers: grandTotalRecords.reduce((sum: number, r: any) => sum + Number(r.others), 0),
      grandTotal: grandTotalRecords.reduce((sum: number, r: any) => sum + Number(r.total), 0),
      dates: Object.keys(groupedByDate).length,
      sections: [...new Set(manpowerRecords.map((r: any) => r.section))].length
    };

    // Calculate attendance rate
    const attendanceRate = overallSummary.grandTotal > 0 
      ? (overallSummary.totalPresent / overallSummary.grandTotal) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        records: groupedByDate,
        summary: {
          ...overallSummary,
          attendanceRate: Number(attendanceRate.toFixed(1))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching manpower summary:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch manpower summary: ${error}` },
      { status: 500 }
    );
  }
}