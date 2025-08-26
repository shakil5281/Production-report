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

    // Get cutting production data for the date
    const cuttingData = await prisma.productionEntry.findMany({
      where: {
        date: date,
        stage: 'CUTTING'
      },
      include: {
        line: true,
        style: true
      }
    });

    // Calculate summary statistics
    const summary = {
      totalCuttingInput: 0,
      totalCuttingOutput: 0,
      totalCuttingWIP: 0,
      totalCuttingDefects: 0,
      cuttingEfficiency: 0,
      byLine: [] as Array<{
        lineId: string;
        lineName: string;
        lineCode: string;
        inputQty: number;
        outputQty: number;
        wip: number;
        defects: number;
        efficiency: number;
      }>,
      byStyle: [] as Array<{
        styleNumber: string;
        buyer: string;
        inputQty: number;
        outputQty: number;
        wip: number;
        defects: number;
        efficiency: number;
      }>,
      cuttingTrends: {
        currentDay: 0,
        previousDay: 0,
        change: 0,
        changePercentage: 0
      },
      topPerformingLines: [] as Array<{
        lineName: string;
        efficiency: number;
        outputQty: number;
      }>
    };

    // Calculate totals
    cuttingData.forEach(entry => {
      summary.totalCuttingInput += entry.inputQty;
      summary.totalCuttingOutput += entry.outputQty;
      summary.totalCuttingDefects += entry.defectQty;
    });

    summary.totalCuttingWIP = summary.totalCuttingInput - summary.totalCuttingOutput;
    summary.cuttingEfficiency = summary.totalCuttingInput > 0 
      ? Math.round((summary.totalCuttingOutput / summary.totalCuttingInput) * 100) 
      : 0;

    // Calculate by line
    const lineMap = new Map();
    cuttingData.forEach(entry => {
      if (!lineMap.has(entry.lineId)) {
        lineMap.set(entry.lineId, {
          lineId: entry.lineId,
          lineName: entry.line.name,
          lineCode: entry.line.code,
          inputQty: 0,
          outputQty: 0,
          defects: 0,
          wip: 0
        });
      }
      
      const lineData = lineMap.get(entry.lineId);
      lineData.inputQty += entry.inputQty;
      lineData.outputQty += entry.outputQty;
      lineData.defects += entry.defectQty;
    });

    // Calculate WIP and efficiency for each line
    lineMap.forEach(lineData => {
      lineData.wip = lineData.inputQty - lineData.outputQty;
      lineData.efficiency = lineData.inputQty > 0 
        ? Math.round((lineData.outputQty / lineData.inputQty) * 100) 
        : 0;
      summary.byLine.push(lineData);
    });

    // Sort lines by efficiency
    summary.byLine.sort((a, b) => b.efficiency - a.efficiency);

    // Get top performing lines
    summary.topPerformingLines = summary.byLine
      .slice(0, 5)
      .map(line => ({
        lineName: line.lineName,
        efficiency: line.efficiency,
        outputQty: line.outputQty
      }));

    // Calculate by style
    const styleMap = new Map();
    cuttingData.forEach(entry => {
      if (!styleMap.has(entry.styleId)) {
        styleMap.set(entry.styleId, {
          styleNumber: entry.style.styleNumber,
          buyer: entry.style.buyer,
          inputQty: 0,
          outputQty: 0,
          defects: 0,
          wip: 0
        });
      }
      
      const styleData = styleMap.get(entry.styleId);
      styleData.inputQty += entry.inputQty;
      styleData.outputQty += entry.outputQty;
      styleData.defects += entry.defectQty;
    });

    // Calculate WIP and efficiency for each style
    styleMap.forEach(styleData => {
      styleData.wip = styleData.inputQty - styleData.outputQty;
      styleData.efficiency = styleData.inputQty > 0 
        ? Math.round((styleData.outputQty / styleData.inputQty) * 100) 
        : 0;
      summary.byStyle.push(styleData);
    });

    // Sort styles by efficiency
    summary.byStyle.sort((a, b) => b.efficiency - a.efficiency);

    // Get previous day data for trend calculation
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);

    const previousDayData = await prisma.productionEntry.findMany({
      where: {
        date: previousDay,
        stage: 'CUTTING'
      }
    });

    let previousDayOutput = 0;
    previousDayData.forEach(entry => {
      previousDayOutput += entry.outputQty;
    });

    summary.cuttingTrends.currentDay = summary.totalCuttingOutput;
    summary.cuttingTrends.previousDay = previousDayOutput;
    summary.cuttingTrends.change = summary.totalCuttingOutput - previousDayOutput;
    summary.cuttingTrends.changePercentage = previousDayOutput > 0 
      ? Math.round((summary.cuttingTrends.change / previousDayOutput) * 100) 
      : 0;

    return NextResponse.json({
      date: dateParam,
      summary
    });
  } catch (error) {
    console.error('Error fetching cutting summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
