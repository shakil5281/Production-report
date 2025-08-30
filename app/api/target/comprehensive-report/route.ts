import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Interface for consolidated target data
interface ConsolidatedTarget {
  lineNo: string;
  lineName: string;
  styleNo: string;
  buyer: string;
  item: string;
  baseTarget: number;
  targets: any[];
  hourlyProduction: Record<number, number>;
  totalProduction: number;
}

// GET comprehensive target report with all target details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Date parameter is required' 
      }, { status: 400 });
    }

    const formattedDate = date;
    const startOfDay = new Date(formattedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(formattedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch targets for the specified date
    const targets = await prisma.target.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: [
        { lineNo: 'asc' },
        { styleNo: 'asc' }
      ]
    });

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        timeSlotHeaders: [],
        summary: {
          totalLines: 0,
          totalTarget: 0,
          totalProduction: 0
        }
      });
    }

    // Fetch production entries for the same date
    const productionEntries = await prisma.productionEntry.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        line: true,
        style: true
      }
    });

    // Get unique time slots from production entries
    const timeSlots = new Set<number>();
    productionEntries.forEach(entry => {
      timeSlots.add(entry.hourIndex);
    });

    const timeSlotHeaders = Array.from(timeSlots).sort((a, b) => a - b);

    // Group targets by line and style
    const targetGroups = new Map<string, ConsolidatedTarget>();

    targets.forEach(target => {
      const groupKey = `${target.lineNo}-${target.styleNo}`;
      
      if (!targetGroups.has(groupKey)) {
        targetGroups.set(groupKey, {
          lineNo: target.lineNo,
          lineName: target.lineNo, // Use lineNo as lineName since we don't have line relation
          styleNo: target.styleNo,
          buyer: '', // We don't have buyer info from Target model
          item: '', // We don't have item info from Target model
          baseTarget: target.lineTarget,
          targets: [],
          hourlyProduction: {},
          totalProduction: 0
        });
      }

      const group = targetGroups.get(groupKey)!;
      group.targets.push(target);
    });

    // Process each consolidated group
    const reportData: ConsolidatedTarget[] = [];
    
    for (const [groupKey, group] of targetGroups) {
      // Calculate hourly production for this consolidated group
      const hourlyProduction: Record<number, number> = {};
      let totalProduction = 0;

      // Sum production from all targets in this group
      group.targets.forEach(target => {
        // Find production entries by matching line and style codes
        const targetProductionEntries = productionEntries.filter(entry => {
          const line = entry.line;
          const style = entry.style;
          return line && style && 
                 line.code === target.lineNo && 
                 style.styleNumber === target.styleNo;
        });

        targetProductionEntries.forEach(entry => {
          const hour = entry.hourIndex;
          hourlyProduction[hour] = (hourlyProduction[hour] || 0) + entry.outputQty;
          totalProduction += entry.outputQty;
        });
      });

      group.hourlyProduction = hourlyProduction;
      group.totalProduction = totalProduction;
      reportData.push(group);
    }

    // Calculate summary
    const summary = {
      totalLines: new Set(reportData.map(item => item.lineNo)).size,
      totalTarget: reportData.reduce((sum, item) => sum + item.baseTarget, 0),
      totalProduction: reportData.reduce((sum, item) => sum + item.totalProduction, 0)
    };

    // Calculate time slot totals
    const timeSlotTotals: Record<number, number> = {};
    timeSlotHeaders.forEach(hour => {
      timeSlotTotals[hour] = reportData.reduce((sum, item) => 
        sum + (item.hourlyProduction[hour] || 0), 0
      );
    });

    return NextResponse.json({
      success: true,
      data: reportData,
      timeSlotHeaders,
      timeSlotTotals,
      summary
    });

  } catch (error) {
    console.error('Error in comprehensive target report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
