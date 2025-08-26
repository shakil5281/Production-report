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

    // Get target data for the date
    const targetData = await prisma.target.findMany({
      where: {
        date: date
      },
      include: {
        productionList: true
      }
    });

    // Calculate summary statistics
    const summary = {
      totalTargets: targetData.length,
      totalLineTarget: 0,
      totalHourlyProduction: 0,
      averageEfficiency: 0,
      byLine: [] as Array<{
        lineNo: string;
        totalTarget: number;
        totalHourlyProduction: number;
        efficiency: number;
        styleCount: number;
      }>,
      topPerformingLines: [] as Array<{
        lineNo: string;
        efficiency: number;
        totalProduction: number;
      }>,
      targetVsActual: {
        totalTarget: 0,
        totalActual: 0,
        variance: 0,
        variancePercentage: 0
      }
    };

    // Calculate totals
    targetData.forEach(target => {
      summary.totalLineTarget += target.lineTarget;
      summary.totalHourlyProduction += target.hourlyProduction;
    });

    // Calculate average efficiency
    summary.averageEfficiency = summary.totalLineTarget > 0 
      ? Math.round((summary.totalHourlyProduction / summary.totalLineTarget) * 100) 
      : 0;

    // Calculate by line
    const lineMap = new Map();
    targetData.forEach(target => {
      if (!lineMap.has(target.lineNo)) {
        lineMap.set(target.lineNo, {
          lineNo: target.lineNo,
          totalTarget: 0,
          totalHourlyProduction: 0,
          styleCount: 0
        });
      }
      
      const lineData = lineMap.get(target.lineNo);
      lineData.totalTarget += target.lineTarget;
      lineData.totalHourlyProduction += target.hourlyProduction;
      lineData.styleCount += 1;
    });

    // Calculate efficiency for each line
    lineMap.forEach(lineData => {
      lineData.efficiency = lineData.totalTarget > 0 
        ? Math.round((lineData.totalHourlyProduction / lineData.totalTarget) * 100) 
        : 0;
      summary.byLine.push(lineData);
    });

    // Sort lines by efficiency
    summary.byLine.sort((a, b) => b.efficiency - a.efficiency);

    // Get top performing lines
    summary.topPerformingLines = summary.byLine
      .slice(0, 5)
      .map(line => ({
        lineNo: line.lineNo,
        efficiency: line.efficiency,
        totalProduction: line.totalHourlyProduction
      }));

    // Calculate target vs actual
    summary.targetVsActual.totalTarget = summary.totalLineTarget;
    summary.targetVsActual.totalActual = summary.totalHourlyProduction;
    summary.targetVsActual.variance = summary.totalHourlyProduction - summary.totalLineTarget;
    summary.targetVsActual.variancePercentage = summary.totalLineTarget > 0 
      ? Math.round((summary.targetVsActual.variance / summary.totalLineTarget) * 100) 
      : 0;

    return NextResponse.json({
      date: dateParam,
      summary
    });
  } catch (error) {
    console.error('Error fetching target summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
