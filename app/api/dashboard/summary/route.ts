import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ 
        success: false, 
        error: 'Date parameter is required' 
      }, { status: 400 });
    }

    const date = new Date(dateParam);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch data for the specified date
    const [dailyProductionReports, targets, expenses, cashbookEntries] = await Promise.all([
      prisma.dailyProductionReport.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      prisma.target.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      prisma.cashbookEntry.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })
    ]);

    // Calculate summary statistics
    const totalProduction = dailyProductionReports.reduce((sum, report) => sum + report.productionQty, 0);
    const totalTarget = dailyProductionReports.reduce((sum, report) => sum + report.targetQty, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const totalCashbook = cashbookEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const totalTargets = targets.reduce((sum, target) => sum + target.lineTarget, 0);

    const summary = {
      date: dateParam,
      production: {
        total: totalProduction,
        target: totalTarget,
        efficiency: totalTarget > 0 ? Number(((totalProduction / totalTarget) * 100).toFixed(2)) : 0,
        byStage: {
          cutting: { input: 0, output: 0, wip: 0 },
          sewing: { input: 0, output: 0, wip: 0 },
          finishing: { input: 0, output: 0, wip: 0 }
        }
      },
      target: {
        total: targets.length,
        totalTarget: totalTargets,
        efficiency: totalTargets > 0 ? Number(((totalProduction / totalTargets) * 100).toFixed(2)) : 0,
        topPerformingLines: targets.map(target => ({
          lineNo: target.lineNo,
          efficiency: totalTargets > 0 ? Number(((totalProduction / totalTargets) * 100).toFixed(2)) : 0,
          totalProduction: totalProduction
        }))
      },
      cashbook: {
        total: totalCashbook,
        count: cashbookEntries.length,
        netCashFlow: totalCashbook - totalExpenses
      },
      cutting: {
        efficiency: 0,
        totalOutput: 0
      },
      overview: {
        totalProduction: totalProduction,
        totalTarget: totalTargets,
        targetAchievement: totalTargets > 0 ? Number(((totalProduction / totalTargets) * 100).toFixed(2)) : 0,
        netCashFlow: totalCashbook - totalExpenses,
        cuttingEfficiency: 0
      }
    };

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error in dashboard summary API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
