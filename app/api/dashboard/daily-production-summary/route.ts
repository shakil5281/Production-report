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

    // Get production data for the date
    const productionData = await prisma.productionEntry.findMany({
      where: {
        date: date
      },
      include: {
        line: true,
        style: true
      }
    });

    // Calculate summary statistics
    const summary = {
      totalProduction: 0,
      totalDefects: 0,
      totalRework: 0,
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

    // Calculate totals by stage
    productionData.forEach(entry => {
      summary.totalProduction += entry.outputQty;
      summary.totalDefects += entry.defectQty;
      summary.totalRework += entry.reworkQty;

      const stage = entry.stage.toLowerCase() as keyof typeof summary.byStage;
      if (summary.byStage[stage as keyof typeof summary.byStage]) {
        summary.byStage[stage as keyof typeof summary.byStage].input += entry.inputQty;
        summary.byStage[stage as keyof typeof summary.byStage].output += entry.outputQty;
      }
    });

    // Calculate WIP (Work in Progress)
    Object.keys(summary.byStage).forEach(stage => {
      const stageKey = stage as keyof typeof summary.byStage;
      const stageData = summary.byStage[stageKey];
      stageData.wip = stageData.input - stageData.output;
    });

    // Calculate by line
    const lineMap = new Map();
    productionData.forEach(entry => {
      if (!lineMap.has(entry.lineId)) {
        lineMap.set(entry.lineId, {
          lineId: entry.lineId,
          lineName: entry.line.name,
          lineCode: entry.line.code,
          totalOutput: 0,
          totalDefects: 0,
          totalInput: 0
        });
      }
      
      const lineData = lineMap.get(entry.lineId);
      lineData.totalOutput += entry.outputQty;
      lineData.totalDefects += entry.defectQty;
      lineData.totalInput += entry.inputQty;
    });

    // Calculate efficiency for each line
    lineMap.forEach(lineData => {
      lineData.efficiency = lineData.totalInput > 0 
        ? Math.round((lineData.totalOutput / lineData.totalInput) * 100) 
        : 0;
      summary.byLine.push(lineData);
    });

    // Sort lines by efficiency
    summary.byLine.sort((a, b) => b.efficiency - a.efficiency);

    // Calculate top performing styles
    const styleMap = new Map();
    productionData.forEach(entry => {
      if (!styleMap.has(entry.styleId)) {
        styleMap.set(entry.styleId, {
          styleNumber: entry.style.styleNumber,
          buyer: entry.style.buyer,
          totalOutput: 0,
          totalInput: 0
        });
      }
      
      const styleData = styleMap.get(entry.styleId);
      styleData.totalOutput += entry.outputQty;
      styleData.totalInput += entry.inputQty;
    });

    // Calculate efficiency for each style
    styleMap.forEach(styleData => {
      styleData.efficiency = styleData.totalInput > 0 
        ? Math.round((styleData.totalOutput / styleData.totalInput) * 100) 
        : 0;
      summary.topStyles.push(styleData);
    });

    // Sort styles by efficiency and take top 5
    summary.topStyles.sort((a, b) => b.efficiency - a.efficiency);
    summary.topStyles = summary.topStyles.slice(0, 5);

    return NextResponse.json({
      date: dateParam,
      summary
    });
  } catch (error) {
    console.error('Error fetching daily production summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
