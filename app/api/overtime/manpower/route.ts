import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET manpower data for overtime calculation
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

    const dateString = date;

    // Get manpower sections from manpower_summary (only individual sections, not totals)
    const manpowerSections = await prisma.$queryRaw`
      SELECT 
        section,
        SUM(present)::integer as present_workers,
        SUM(total)::integer as total_workers
      FROM manpower_summary
      WHERE date::date = ${dateString}::date
        AND "itemType" = 'SECTION'
        AND section NOT LIKE '%Total%'
        AND section != 'Grand Total'
      GROUP BY section
      ORDER BY 
        CASE section
          WHEN 'Cutting' THEN 1
          WHEN 'Finishing' THEN 2
          WHEN 'Quality' THEN 3
          WHEN 'Inputman' THEN 4
          WHEN 'Ironman' THEN 5
          WHEN 'Office Staff' THEN 6
          WHEN 'Mechanical Staff' THEN 7
          WHEN 'Macanical - Staff' THEN 7
          WHEN 'Production Staff' THEN 8
          ELSE 9
        END,
        section ASC
    ` as any[];

    // Get line data for Helper and Operator sections
    const lineData = await prisma.$queryRaw`
      SELECT 
        section,
        subsection,
        COUNT(*)::integer as line_count,
        SUM(present)::integer as present_workers,
        SUM(total)::integer as total_workers
      FROM manpower_summary
      WHERE date::date = ${dateString}::date
        AND "itemType" = 'LINE'
        AND (section = 'Sewing Helper' OR section = 'Operator Lines')
      GROUP BY section, subsection
      ORDER BY section ASC, subsection ASC
    ` as any[];

    // Organize the data for overtime management
    const overtimeSections = [];

    // Add individual sections
    manpowerSections.forEach((section: any) => {
      overtimeSections.push({
        section: section.section,
        type: 'section',
        presentWorkers: Number(section.present_workers),
        totalWorkers: Number(section.total_workers),
        suggestedWorkers: Number(section.present_workers), // Default to present workers
        manpowerDisplay: `${section.present_workers}/${section.total_workers}` // Display like "22/28"
      });
    });

    // Add line data grouped by type
    const helperLines = lineData.filter((line: any) => line.section === 'Sewing Helper');
    const operatorLines = lineData.filter((line: any) => line.section === 'Operator Lines');

    if (helperLines.length > 0) {
      const totalHelperWorkers = helperLines.reduce((sum, line) => sum + Number(line.present_workers), 0);
      const totalHelperWorkersTotal = helperLines.reduce((sum, line) => sum + Number(line.total_workers), 0);
      overtimeSections.push({
        section: 'Helper',
        type: 'line_group',
        presentWorkers: totalHelperWorkers,
        totalWorkers: totalHelperWorkersTotal,
        suggestedWorkers: totalHelperWorkers,
        lineCount: helperLines.length,
        manpowerDisplay: `${totalHelperWorkers}/${totalHelperWorkersTotal}`
      });
    }

    if (operatorLines.length > 0) {
      const totalOperatorWorkers = operatorLines.reduce((sum, line) => sum + Number(line.present_workers), 0);
      const totalOperatorWorkersTotal = operatorLines.reduce((sum, line) => sum + Number(line.total_workers), 0);
      overtimeSections.push({
        section: 'Operator',
        type: 'line_group',
        presentWorkers: totalOperatorWorkers,
        totalWorkers: totalOperatorWorkersTotal,
        suggestedWorkers: totalOperatorWorkers,
        lineCount: operatorLines.length,
        manpowerDisplay: `${totalOperatorWorkers}/${totalOperatorWorkersTotal}`
      });
    }

    // Check if we have any manpower data
    if (overtimeSections.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No manpower data found for the specified date. Please import manpower data first.',
        data: {
          sections: [],
          hasManpowerData: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        date: dateString,
        sections: overtimeSections,
        hasManpowerData: true,
        summary: {
          totalSections: overtimeSections.length,
          totalPresentWorkers: overtimeSections.reduce((sum, s) => sum + s.presentWorkers, 0),
          totalWorkers: overtimeSections.reduce((sum, s) => sum + s.totalWorkers, 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching manpower data for overtime:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch manpower data: ${error}` },
      { status: 500 }
    );
  }
}
