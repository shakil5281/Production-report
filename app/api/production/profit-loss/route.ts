import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

// GET /api/production/profit-loss - Get Profit & Loss data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const lineId = searchParams.get('lineId');

    let dateFilter: Prisma.DateTimeFilter = {};
    
    if (startDate && endDate) {
      try {
        const startDateTime = new Date(startDate + 'T00:00:00Z');
        const endDateTime = new Date(endDate + 'T23:59:59Z');
        
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date format' },
            { status: 400 }
          );
        }
        
        dateFilter = {
          gte: startDateTime,
          lte: endDateTime
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    } else {
      // Default to current period
      const now = new Date();
      let start: Date;
      const end: Date = now;

      switch (period) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly': {
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          start = new Date(now.getFullYear(), now.getMonth(), diff);
          break;
        }
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      
      dateFilter = { gte: start, lte: end };
    }

    const whereClause: Prisma.ProductionEntryWhereInput = { date: dateFilter };
    if (lineId && lineId !== 'all') {
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
      where: { 
        date: dateFilter, 
        ...(lineId && lineId !== 'all' ? { lineId } : {}) 
      },
      include: {
        line: true,
        category: true
      }
    });

    // Calculate earned production (revenue)
    type StyleRevenue = {
      styleId: string;
      lineId: string | null;
      style: typeof productionData[number]['style'];
      line: typeof productionData[number]['line'];
      totalOutput: number;
      totalRevenue: number;
    };

    const productionByStyle = new Map<string, StyleRevenue>();
    
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
        
        const styleData = productionByStyle.get(key)!;
        styleData.totalOutput += entry.outputQty || 0;
        styleData.totalRevenue += (entry.outputQty || 0) * Number(entry.style.unitPrice || 0);
      }
    });

    const totalEarnedProduction = Array.from(productionByStyle.values())
      .reduce((sum, style) => sum + style.totalRevenue, 0);

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    // Calculate profit
    const profit = totalEarnedProduction - totalExpenses;

    // Group expenses by category
    type ExpensesByCategory = Record<string, { category: typeof expenses[number]['category']; total: number; count: number }>;
    const expensesByCategory: ExpensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category?.name || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = {
          category: expense.category,
          total: 0,
          count: 0
        };
      }
      acc[category].total += Number(expense.amount || 0);
      acc[category].count += 1;
      return acc;
    }, {} as ExpensesByCategory);

    // Group expenses by line
    type ExpensesByLine = Record<string, { line: typeof expenses[number]['line']; total: number; count: number }>;
    const expensesByLine: ExpensesByLine = expenses.reduce((acc, expense) => {
      const lineName = expense.line?.name || 'General';
      if (!acc[lineName]) {
        acc[lineName] = {
          line: expense.line,
          total: 0,
          count: 0
        };
      }
      acc[lineName].total += Number(expense.amount || 0);
      acc[lineName].count += 1;
      return acc;
    }, {} as ExpensesByLine);

    // Calculate production efficiency metrics
    const totalInput = productionData.reduce((sum, entry) => sum + (entry.inputQty || 0), 0);
    const totalOutput = productionData.reduce((sum, entry) => sum + (entry.outputQty || 0), 0);
    const totalDefects = productionData.reduce((sum, entry) => sum + (entry.defectQty || 0), 0);
    const totalRework = productionData.reduce((sum, entry) => sum + (entry.reworkQty || 0), 0);

    const efficiency = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;
    const defectRate = totalOutput > 0 ? (totalDefects / totalOutput) * 100 : 0;
    const reworkRate = totalOutput > 0 ? (totalRework / totalOutput) * 100 : 0;

    return NextResponse.json({
      period,
      dateRange: {
        start: (dateFilter as Prisma.DateTimeFilter).gte ?? null,
        end: (dateFilter as Prisma.DateTimeFilter).lte ?? null
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
