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
    const summary = {
      date: dateParam,
      production: {
        total: dailyProductionReports.reduce((sum, report) => sum + report.productionQty, 0),
        target: dailyProductionReports.reduce((sum, report) => sum + report.targetQty, 0),
        efficiency: dailyProductionReports.length > 0 
          ? (dailyProductionReports.reduce((sum, report) => sum + report.productionQty, 0) / 
             dailyProductionReports.reduce((sum, report) => sum + report.targetQty, 0) * 100).toFixed(2)
          : 0
      },
      targets: {
        total: targets.length,
        totalTarget: targets.reduce((sum, target) => sum + target.lineTarget, 0)
      },
      expenses: {
        total: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
        count: expenses.length
      },
      cashbook: {
        total: cashbookEntries.reduce((sum, entry) => sum + Number(entry.amount), 0),
        count: cashbookEntries.length
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
