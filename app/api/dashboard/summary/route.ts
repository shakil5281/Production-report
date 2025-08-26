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

    // Get all summary data in parallel
    const [productionSummary, targetSummary, cashbookSummary, cuttingSummary] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/daily-production-summary?date=${dateParam}`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/target-summary?date=${dateParam}`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/cashbook-summary?date=${dateParam}`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/cutting-summary?date=${dateParam}`).then(res => res.json())
    ]);

    // Combine all summaries
    const dashboardSummary = {
      date: dateParam,
      production: productionSummary.summary,
      target: targetSummary.summary,
      cashbook: cashbookSummary.summary,
      cutting: cuttingSummary.summary,
      overview: {
        totalProduction: productionSummary.summary?.totalProduction || 0,
        totalTarget: targetSummary.summary?.totalLineTarget || 0,
        targetAchievement: targetSummary.summary?.totalLineTarget > 0 
          ? Math.round((productionSummary.summary?.totalProduction / targetSummary.summary?.totalLineTarget) * 100) 
          : 0,
        netCashFlow: cashbookSummary.summary?.netCashFlow || 0,
        cuttingEfficiency: cuttingSummary.summary?.cuttingEfficiency || 0
      }
    };

    return NextResponse.json(dashboardSummary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
