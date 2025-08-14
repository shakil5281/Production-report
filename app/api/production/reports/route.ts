import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET production reports with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const lineId = searchParams.get('lineId');
    const styleId = searchParams.get('styleId');
    const stage = searchParams.get('stage');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate + 'T00:00:00Z'),
        lte: new Date(endDate + 'T23:59:59Z')
      };
    }
    
    if (lineId && lineId !== 'all') {
      where.lineId = lineId;
    }
    
    if (styleId && styleId !== 'all') {
      where.styleId = styleId;
    }
    
    if (stage && stage !== 'all') {
      where.stage = stage;
    }

    // Get production entries with pagination
    const [entries, total] = await Promise.all([
      prisma.productionEntry.findMany({
        where,
        include: {
          line: true,
          style: true
        },
        orderBy: [
          { date: 'desc' },
          { hourIndex: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.productionEntry.count({ where })
    ]);

    // Calculate summary statistics
    const summary = await prisma.productionEntry.aggregate({
      where,
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

    // Get line-wise summary
    const lineSummary = await prisma.productionEntry.groupBy({
      by: ['lineId'],
      where,
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

    // Get style-wise summary
    const styleSummary = await prisma.productionEntry.groupBy({
      by: ['styleId'],
      where,
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

    // Get daily summary
    const dailySummary = await prisma.productionEntry.groupBy({
      by: ['date'],
      where,
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
        date: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
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
        dailySummary,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching production reports:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch production reports' },
      { status: 500 }
    );
  }
}
