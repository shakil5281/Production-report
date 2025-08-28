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
    const startOfDay = new Date(dateString + 'T00:00:00Z');
    const endOfDay = new Date(dateString + 'T23:59:59Z');
    
    const manpowerSections = await prisma.manpowerSummary.groupBy({
      by: ['section'],
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        itemType: 'SECTION',
        section: {
          not: {
            contains: 'Total'
          }
        }
      },
      _sum: {
        present: true,
        total: true
      },
      orderBy: {
        section: 'asc'
      }
    });

    // Get line data for Helper and Operator sections
    const lineData = await prisma.manpowerSummary.groupBy({
      by: ['section', 'subsection'],
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        itemType: 'LINE',
        section: {
          in: ['Sewing Helper', 'Operator Lines']
        }
      },
      _count: {
        id: true
      },
      _sum: {
        present: true,
        total: true
      },
      orderBy: [
        { section: 'asc' },
        { subsection: 'asc' }
      ]
    });

    // Organize the data for overtime management
    const overtimeSections = [];

    // Add individual sections
    manpowerSections.forEach((section) => {
      overtimeSections.push({
        section: section.section,
        type: 'section',
        presentWorkers: Number(section._sum.present || 0),
        totalWorkers: Number(section._sum.total || 0),
        suggestedWorkers: Number(section._sum.present || 0), // Default to present workers
        manpowerDisplay: `${section._sum.present || 0}/${section._sum.total || 0}` // Display like "22/28"
      });
    });

    // Add line data grouped by type
    const helperLines = lineData.filter((line) => line.section === 'Sewing Helper');
    const operatorLines = lineData.filter((line) => line.section === 'Operator Lines');

    if (helperLines.length > 0) {
      const totalHelperWorkers = helperLines.reduce((sum, line) => sum + Number(line._sum.present || 0), 0);
      const totalHelperWorkersTotal = helperLines.reduce((sum, line) => sum + Number(line._sum.total || 0), 0);
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
      const totalOperatorWorkers = operatorLines.reduce((sum, line) => sum + Number(line._sum.present || 0), 0);
      const totalOperatorWorkersTotal = operatorLines.reduce((sum, line) => sum + Number(line._sum.total || 0), 0);
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
