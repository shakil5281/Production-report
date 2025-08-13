import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/production/profit-loss - Get Profit & Loss data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const lineId = searchParams.get('lineId');

    let dateFilter: any = {};
    
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      // Default to current period
      const now = new Date();
      let start: Date;
      let end: Date = now;

      switch (period) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          start = new Date(now.getFullYear(), now.getMonth(), diff);
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      
      dateFilter = { gte: start, lte: end };
    }

    const whereClause: any = { date: dateFilter };
    if (lineId) {
      whereClause.lineId = lineId;
    }

    // Get production data for the period
    const productionData = await prisma.productionEntry.findMany({
      where: whereClause,
      include: {
        line: true,
        style: true
      }
    });

    // Get expenses for the period
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        line: true,
        category: true
      }
    });

    // Calculate earned production (revenue)
    const productionByStyle = new Map();
    
    productionData.forEach(entry => {
      if (entry.stage === 'FINISHING' && entry.outputQty > 0) {
        const key = `${entry.styleId}-${entry.lineId}`;
        if (!productionByStyle.has(key)) {
          productionByStyle.set(key, {
            styleId: entry.styleId,
            lineId: entry.lineId,
            style: entry.style,
            line: entry.line,
            totalOutput: 0,
            totalRevenue: 0
          });
        }
        
        const styleData = productionByStyle.get(key);
        styleData.totalOutput += entry.outputQty;
        styleData.totalRevenue += entry.outputQty * Number(entry.style.unitPrice);
      }
    });

    const totalEarnedProduction = Array.from(productionByStyle.values())
      .reduce((sum, style) => sum + style.totalRevenue, 0);

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Calculate profit
    const profit = totalEarnedProduction - totalExpenses;

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category.name;
      if (!acc[category]) {
        acc[category] = {
          category: expense.category,
          total: 0,
          count: 0
        };
      }
      acc[category].total += Number(expense.amount);
      acc[category].count += 1;
      return acc;
    }, {} as any);

    // Group expenses by line
    const expensesByLine = expenses.reduce((acc, expense) => {
      const lineName = expense.line ? expense.line.name : 'General';
      if (!acc[lineName]) {
        acc[lineName] = {
          line: expense.line,
          total: 0,
          count: 0
        };
      }
      acc[lineName].total += Number(expense.amount);
      acc[lineName].count += 1;
      return acc;
    }, {} as any);

    // Calculate production efficiency metrics
    const totalInput = productionData.reduce((sum, entry) => sum + entry.inputQty, 0);
    const totalOutput = productionData.reduce((sum, entry) => sum + entry.outputQty, 0);
    const totalDefects = productionData.reduce((sum, entry) => sum + entry.defectQty, 0);
    const totalRework = productionData.reduce((sum, entry) => sum + entry.reworkQty, 0);

    const efficiency = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;
    const defectRate = totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;
    const reworkRate = totalOutput > 0 ? (totalRework / totalOutput) * 100 : 0;

    return NextResponse.json({
      period,
      dateRange: {
        start: dateFilter.gte,
        end: dateFilter.lte
      },
      summary: {
        totalEarnedProduction,
        totalExpenses,
        profit,
        profitMargin: totalEarnedProduction > 0 ? (profit / totalEarnedProduction) * 100 : 0
      },
      production: {
        totalInput,
        totalOutput,
        totalDefects,
        totalRework,
        efficiency,
        defectRate,
        reworkRate,
        styles: Array.from(productionByStyle.values())
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        byLine: expensesByLine
      },
      breakdown: {
        productionByStyle: Array.from(productionByStyle.values()),
        expensesByCategory: Object.values(expensesByCategory),
        expensesByLine: Object.values(expensesByLine)
      }
    });
  } catch (error) {
    console.error('Error calculating profit & loss:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
