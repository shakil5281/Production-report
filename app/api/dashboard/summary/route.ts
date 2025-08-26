import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const date = new Date(dateParam);

    console.log('Fetching dashboard data for date:', dateParam);

    // Get all summary data in parallel using direct database queries
    const [productionData, targetData, cashbookData, cuttingData] = await Promise.all([
      // Production summary - using DailyProductionReport instead of ProductionEntry
      prisma.dailyProductionReport.findMany({
        where: { 
          date: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
            lte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
          }
        },
        include: { 
          productionList: {
            select: {
              buyer: true,
              item: true
            }
          }
        }
      }).catch(err => {
        console.error('Error fetching production data:', err);
        return [];
      }),
      // Target summary - using StyleAssignment
      prisma.styleAssignment.findMany({
        where: { 
          startDate: { lte: date },
          OR: [
            { endDate: null },
            { endDate: { gte: date } }
          ]
        },
        include: { line: true, style: true }
      }).catch(err => {
        console.error('Error fetching target data:', err);
        return [];
      }),
      // Cashbook summary
      prisma.cashbookEntry.findMany({
        where: { 
          date: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
            lte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
          }
        }
      }).catch(err => {
        console.error('Error fetching cashbook data:', err);
        return [];
      }),
      // Cutting summary - using DailyProductionReport for cutting data
      prisma.dailyProductionReport.findMany({
        where: { 
          date: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
            lte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
          }
        },
        include: { 
          productionList: {
            select: {
              buyer: true,
              item: true
            }
          }
        }
      }).catch(err => {
        console.error('Error fetching cutting data:', err);
        return [];
      })
    ]);

    console.log('Data fetched successfully:', {
      productionCount: productionData.length,
      targetCount: targetData.length,
      cashbookCount: cashbookData.length,
      cuttingCount: cuttingData.length
    });

    // Calculate production summary from DailyProductionReport
    const productionSummary = {
      totalProduction: productionData.reduce((sum, entry) => sum + (entry.productionQty || 0), 0),
      totalTarget: productionData.reduce((sum, entry) => sum + (entry.targetQty || 0), 0),
      totalDefects: 0, // Not available in DailyProductionReport
      totalRework: 0,  // Not available in DailyProductionReport
      byStage: {
        cutting: { input: 0, output: 0, wip: 0 },
        sewing: { input: 0, output: 0, wip: 0 },
        finishing: { input: 0, output: 0, wip: 0 }
      },
      byLine: [] as Array<{
        lineId: string;
        lineName: string;
        lineCode: string;
        totalOutput: number;
        totalDefects: number;
        efficiency: number;
      }>,
      topStyles: [] as Array<{
        styleNumber: string;
        buyer: string;
        totalOutput: number;
        efficiency: number;
      }>
    };

    // Calculate totals by line (since DailyProductionReport has lineNo)
    const lineMap = new Map();
    productionData.forEach(entry => {
      if (entry.lineNo) {
        if (!lineMap.has(entry.lineNo)) {
          lineMap.set(entry.lineNo, {
            lineId: entry.lineNo,
            lineName: `Line ${entry.lineNo}`,
            lineCode: entry.lineNo,
            totalOutput: 0,
            totalTarget: 0,
            totalDefects: 0,
            totalInput: 0
          });
        }
        
        const lineData = lineMap.get(entry.lineNo);
        lineData.totalOutput += entry.productionQty || 0;
        lineData.totalTarget += entry.targetQty || 0;
        lineData.totalInput += entry.targetQty || 0; // Use target as input for efficiency calculation
      }
    });

    // Calculate efficiency for each line
    lineMap.forEach(lineData => {
      lineData.efficiency = lineData.totalInput > 0 
        ? Math.round((lineData.totalOutput / lineData.totalInput) * 100) 
        : 0;
      productionSummary.byLine.push(lineData);
    });

    // Sort lines by efficiency
    productionSummary.byLine.sort((a, b) => b.efficiency - a.efficiency);

    // Calculate top performing styles
    const styleMap = new Map();
    productionData.forEach(entry => {
      if (entry.styleNo && entry.productionList) {
        if (!styleMap.has(entry.styleNo)) {
          styleMap.set(entry.styleNo, {
            styleNumber: entry.styleNo,
            buyer: entry.productionList.buyer || 'Unknown Buyer',
            totalOutput: 0,
            totalInput: 0
          });
        }
        
        const styleData = styleMap.get(entry.styleNo);
        styleData.totalOutput += entry.productionQty || 0;
        styleData.totalInput += entry.targetQty || 0;
      }
    });

    // Calculate efficiency for each style
    styleMap.forEach(styleData => {
      styleData.efficiency = styleData.totalInput > 0 
        ? Math.round((styleData.totalOutput / styleData.totalInput) * 100) 
        : 0;
      productionSummary.topStyles.push(styleData);
    });

    // Sort styles by efficiency and take top 5
    productionSummary.topStyles.sort((a, b) => b.efficiency - a.efficiency);
    productionSummary.topStyles = productionSummary.topStyles.slice(0, 5);

    // Calculate target summary - using StyleAssignment data
    const targetSummary = {
      totalLineTarget: targetData.reduce((sum, assignment) => sum + (assignment.targetPerHour || 0), 0),
      totalAssignedLines: targetData.length,
      targetAchievement: 0
    };

    // Calculate cashbook summary - using correct enum values
    const cashbookSummary = {
      totalIncome: cashbookData
        .filter(entry => entry.type === 'CREDIT')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      totalExpense: cashbookData
        .filter(entry => entry.type === 'DEBIT')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      netCashFlow: 0
    };
    cashbookSummary.netCashFlow = cashbookSummary.totalIncome - cashbookSummary.totalExpense;

    // Calculate cutting summary - using DailyProductionReport data
    const cuttingSummary = {
      totalCuttingInput: cuttingData.reduce((sum, entry) => sum + (entry.targetQty || 0), 0),
      totalCuttingOutput: cuttingData.reduce((sum, entry) => sum + (entry.productionQty || 0), 0),
      cuttingEfficiency: 0
    };
    cuttingSummary.cuttingEfficiency = cuttingSummary.totalCuttingInput > 0 
      ? Math.round((cuttingSummary.totalCuttingOutput / cuttingSummary.totalCuttingInput) * 100) 
      : 0;

    // Calculate target achievement using actual production vs target data
    targetSummary.targetAchievement = productionSummary.totalTarget > 0 
      ? Math.round((productionSummary.totalProduction / productionSummary.totalTarget) * 100) 
      : 0;

    // Combine all summaries
    const dashboardSummary = {
      date: dateParam,
      production: productionSummary,
      target: targetSummary,
      cashbook: cashbookSummary,
      cutting: cuttingSummary,
      overview: {
        totalProduction: productionSummary.totalProduction,
        totalTarget: productionSummary.totalTarget, // Use actual target from production data
        targetAchievement: targetSummary.targetAchievement,
        netCashFlow: cashbookSummary.netCashFlow,
        cuttingEfficiency: cuttingSummary.cuttingEfficiency
      }
    };

    console.log('Dashboard summary calculated successfully:', {
      totalProduction: productionSummary.totalProduction,
      totalTarget: productionSummary.totalTarget,
      targetAchievement: targetSummary.targetAchievement
    });
    
    return NextResponse.json(dashboardSummary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
