import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET daily production summary
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

    // Parse date and create date range
    const startOfDay = new Date(date + 'T00:00:00Z');
    const endOfDay = new Date(date + 'T23:59:59Z');

    // Get production entries for the specific date
    const entries = await prisma.productionEntry.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        line: true,
        style: true
      },
      orderBy: [
        { hourIndex: 'asc' },
        { line: { code: 'asc' } }
      ]
    });

    // Calculate summary statistics
    const summary = await prisma.productionEntry.aggregate({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        inputQty: true,
        outputQty: true,
        defectQty: true,
        reworkQty: true
      },
      _count: {
        id: true
      }
    });

    // Calculate efficiency and rates
    const totalInput = summary._sum.inputQty || 0;
    const totalOutput = summary._sum.outputQty || 0;
    const totalDefects = summary._sum.defectQty || 0;
    const totalRework = summary._sum.reworkQty || 0;
    
    const efficiency = totalInput > 0 ? ((totalOutput / totalInput) * 100) : 0;
    const defectRate = totalOutput > 0 ? ((totalDefects / totalOutput) * 100) : 0;
    const reworkRate = totalOutput > 0 ? ((totalRework / totalOutput) * 100) : 0;

    // Get line-wise summary for the day
    const lineSummary = await prisma.productionEntry.groupBy({
      by: ['lineId'],
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        inputQty: true,
        outputQty: true,
        defectQty: true,
        reworkQty: true
      },
      _count: {
        id: true
      }
    });

    // Get style-wise summary for the day
    const styleSummary = await prisma.productionEntry.groupBy({
      by: ['styleId'],
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        inputQty: true,
        outputQty: true,
        defectQty: true,
        reworkQty: true
      },
      _count: {
        id: true
      }
    });

    // Get hourly summary for the day
    const hourlySummary = await prisma.productionEntry.groupBy({
      by: ['hourIndex'],
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        inputQty: true,
        outputQty: true,
        defectQty: true,
        reworkQty: true
      },
      _count: {
        id: true
      },
      orderBy: {
        hourIndex: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        date,
        entries,
        summary: {
          totalInput,
          totalOutput,
          totalDefects,
          totalRework,
          efficiency: Math.round(efficiency * 100) / 100,
          defectRate: Math.round(defectRate * 100) / 100,
          reworkRate: Math.round(reworkRate * 100) / 100,
          totalEntries: summary._count.id
        },
        lineSummary,
        styleSummary,
        hourlySummary
      }
    });
  } catch (error) {
    console.error('Error fetching daily production summary:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch daily production summary' },
      { status: 500 }
    );
  }
}
