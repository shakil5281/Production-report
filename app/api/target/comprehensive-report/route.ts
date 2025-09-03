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
  hourlyProduction: Record<string, number>;
  totalProduction: number;
  averageProductionPerHour: number;
  totalHours: number;
  totalTargets: number;
  targetEntries: number;
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

    // Fetch targets for the specified date with production list details
    const targets = await prisma.target.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        productionList: true
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

    // Get unique time slots from targets in "inTime-outTime" format
    const timeSlots = new Set<string>();
    targets.forEach(target => {
      if (target.inTime && target.outTime) {
        timeSlots.add(`${target.inTime}-${target.outTime}`);
      }
    });

    const timeSlotHeaders = Array.from(timeSlots).sort();

    // Group targets by line and style
    const targetGroups = new Map<string, ConsolidatedTarget>();

    targets.forEach(target => {
      // Group by Line + Style + baseTarget (not by time slot)
      const groupKey = `${target.lineNo}-${target.styleNo}-${target.lineTarget}`;
      
      if (!targetGroups.has(groupKey)) {
        targetGroups.set(groupKey, {
          lineNo: target.lineNo,
          lineName: target.lineNo, // Use lineNo as lineName since we don't have line relation
          styleNo: target.styleNo,
          buyer: target.productionList?.buyer || '',
          item: target.productionList?.item || '',
          baseTarget: target.lineTarget,
          targets: [],
          hourlyProduction: {},
          totalProduction: 0,
          averageProductionPerHour: 0,
          totalHours: 0,
          totalTargets: 0,
          targetEntries: 0
        });
      }

      const group = targetGroups.get(groupKey)!;
      group.targets.push(target);
    });

    // Process each consolidated group
    const reportData: ConsolidatedTarget[] = [];
    
    for (const [groupKey, group] of targetGroups) {
      // Calculate hourly production for this consolidated group
      const hourlyProduction: Record<string, number> = {};
      let totalProduction = 0;

      // Sum production from all targets in this group
      group.targets.forEach(target => {
        // Use the hourlyProduction directly from the target
        if (target.hourlyProduction) {
          totalProduction += target.hourlyProduction;
        }
        
        // Use time slot format for hourly production - each time slot gets its own column
        if (target.inTime && target.outTime) {
          const timeSlot = `${target.inTime}-${target.outTime}`;
          hourlyProduction[timeSlot] = (hourlyProduction[timeSlot] || 0) + (target.hourlyProduction || 0);
        }
      });

      // Calculate total hours as the number of unique time slots
      const uniqueTimeSlots = new Set<string>();
      group.targets.forEach(target => {
        if (target.inTime && target.outTime) {
          const timeSlot = `${target.inTime}-${target.outTime}`;
          uniqueTimeSlots.add(timeSlot);
        }
      });
      const totalHours = uniqueTimeSlots.size;
      
      // Calculate average production per hour
      const averageProductionPerHour = totalHours > 0 ? totalProduction / totalHours : 0;

      // Calculate total targets as baseTarget * totalHours
      const totalTargets = group.baseTarget * totalHours;

      group.hourlyProduction = hourlyProduction;
      group.totalProduction = totalProduction;
      group.averageProductionPerHour = averageProductionPerHour;
      group.totalHours = totalHours;
      group.totalTargets = totalTargets;
      group.targetEntries = group.targets.length;
      reportData.push(group);
    }

    // Calculate summary
    const totalProduction = reportData.reduce((sum, item) => sum + item.totalProduction, 0);
    const totalHours = reportData.reduce((sum, item) => sum + item.totalHours, 0);
    const averageProductionPerHour = totalHours > 0 ? totalProduction / totalHours : 0;
    
    const summary = {
      totalLines: new Set(reportData.map(item => item.lineNo)).size,
      totalTarget: reportData.reduce((sum, item) => sum + item.baseTarget, 0),
      totalProduction,
      averageProductionPerHour,
      totalConsolidatedEntries: reportData.length,
      totalOriginalEntries: reportData.reduce((sum, item) => sum + item.targetEntries, 0),
      date: formattedDate
    };

    // Calculate time slot totals
    const timeSlotTotals: Record<string, number> = {};
    timeSlotHeaders.forEach(timeSlot => {
      timeSlotTotals[timeSlot] = reportData.reduce((sum, item) => 
        sum + (item.hourlyProduction[timeSlot] || 0), 0
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
