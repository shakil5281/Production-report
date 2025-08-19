import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET comprehensive target report with all target details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Default to current date if no date provided
    const currentDate = new Date();
    const date = dateParam ? new Date(dateParam) : currentDate;
    
    // Format date for logging
    const formattedDate = date.toISOString().split('T')[0];
    
    console.log(`Comprehensive Target Report API called for date: ${formattedDate}`);
    console.log(`Request timestamp: ${new Date().toISOString()}`);
    
    // Create date range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    
    // Get all targets for the specific date
    const targets = await prisma.target.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        productionList: true // Include productionList to get buyer and item
      },
      orderBy: [
        { lineNo: 'asc' },
        { styleNo: 'asc' }
      ]
    });

    console.log(`Found ${targets.length} targets for date ${formattedDate}`);
    
    // Debug: Show each target
    targets.forEach((target, index) => {
      console.log(`  Target ${index + 1}: Line ${target.lineNo}, Style ${target.styleNo}, ID: ${target.id.substring(0, 8)}`);
    });
    
    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        summary: {
          totalLines: 0,
          totalTarget: 0,
          totalProduction: 0,
          averageProductionPerHour: 0,
          date: formattedDate
        },
        message: 'No targets found for the specified date'
      });
    }

    // Get lines for reference
    const lines = await prisma.line.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });
    
    // Create line map for efficient lookup
    const lineMap = new Map(lines.map(line => [line.code, { name: line.name, id: line.id }]));
    
    // Collect all unique time slots from targets
    const uniqueTimeSlots = new Set<string>();
    targets.forEach(target => {
      const timeSlot = `${target.inTime || '08:00'}-${target.outTime || '20:00'}`;
      uniqueTimeSlots.add(timeSlot);
    });
    
    // Convert to sorted array
    const timeSlotHeaders = Array.from(uniqueTimeSlots).sort((a, b) => {
      const aStart = parseInt(a.split('-')[0].split(':')[0]);
      const bStart = parseInt(b.split('-')[0].split(':')[0]);
      return aStart - bStart;
    });
    
    // console.log(`Unique time slots found: ${timeSlotHeaders.join(', ')}`);
    
    // Group targets by line, date, and time to show all lines separately
    // Each unique combination of line + date + time = separate row
    const targetGroups = new Map();
    
    targets.forEach(target => {
      // Create unique key for each individual target entry
      const groupKey = `${target.lineNo}-${target.styleNo}-${target.id}`;
      
      if (!targetGroups.has(groupKey)) {
        targetGroups.set(groupKey, {
          lineNo: target.lineNo,
          styleNo: target.styleNo,
          targets: [],
          productionList: target.productionList
        });
      }
      
      targetGroups.get(groupKey).targets.push(target);
    });
    
    console.log(`Grouped into ${targetGroups.size} unique target entries`);
    
    // Debug: Show each group
    let debugIndex = 1;
    targetGroups.forEach((group, groupKey) => {
      console.log(`  Group ${debugIndex}: Line ${group.lineNo}, Style ${group.styleNo}, Targets: ${group.targets.length}`);
      debugIndex++;
    });
    
    // Initialize report data array
    const reportData: any[] = [];
    
    targetGroups.forEach((group, groupKey) => {
      // console.log(`Processing group: ${groupKey}`);
      
      // Calculate total target (sum of all targets in this group)
      const totalTarget = group.targets.reduce((sum: number, target: any) => sum + target.lineTarget, 0);
      
      // Calculate total working hours (sum of all hours in this group)
      const totalWorkingHours = group.targets.reduce((sum: number, target: any) => {
        const inTime = target.inTime || '08:00';
        const outTime = target.outTime || '20:00';
        const startHour = parseInt(inTime.split(':')[0]);
        const endHour = parseInt(outTime.split(':')[0]);
        return sum + Math.max(1, endHour - startHour);
      }, 0);
      
      // Calculate total targets (target * hours)
      const totalTargets = totalTarget * totalWorkingHours;
      
      // Initialize hourly production with 0 for all time slots
      const hourlyProduction: Record<string, number> = {};
      timeSlotHeaders.forEach(timeSlot => {
        hourlyProduction[timeSlot] = 0;
      });
      
      // Map production data from targets to time slots
      group.targets.forEach((target: any) => {
        const timeSlot = `${target.inTime || '08:00'}-${target.outTime || '20:00'}`;
        if (hourlyProduction.hasOwnProperty(timeSlot)) {
          hourlyProduction[timeSlot] = target.hourlyProduction || 0;
          // console.log(`Style ${group.styleNo}: Added ${target.hourlyProduction || 0} to time slot ${timeSlot}`);
        }
      });
      
      // Calculate totals
      const totalProduction = Object.values(hourlyProduction).reduce((sum: number, val: number) => sum + val, 0);
      const averageProductionPerHour = totalWorkingHours > 0 ? totalProduction / totalWorkingHours : 0;
      
      // console.log(`Style ${group.styleNo} hourly production:`, hourlyProduction);
      // console.log(`Style ${group.styleNo} total production: ${totalProduction}`);
      
      reportData.push({
        id: groupKey, // Use the group key as unique ID
        lineNo: group.lineNo,
        lineName: lineMap.get(group.lineNo)?.name || 'Unknown Line',
        styleNo: group.styleNo,
        buyer: group.productionList?.buyer || 'N/A',
        item: group.productionList?.item || 'N/A',
        target: totalTarget,
        hours: totalWorkingHours,
        totalTargets: totalTargets,
        hourlyProduction,
        totalProduction,
        averageProductionPerHour
      });
    });
    
    // Calculate summary statistics
    const summary = {
      totalLines: new Set(reportData.map(item => item.lineNo)).size,
      totalTarget: reportData.reduce((sum, item) => sum + item.totalTargets, 0),
      totalProduction: reportData.reduce((sum, item) => sum + item.totalProduction, 0),
      averageProductionPerHour: reportData.length > 0 
        ? reportData.reduce((sum, item) => sum + item.averageProductionPerHour, 0) / reportData.length 
        : 0,
      date: formattedDate
    };
    
    // Calculate totals for each time slot
    const timeSlotTotals: Record<string, number> = {};
    timeSlotHeaders.forEach(timeSlot => {
      timeSlotTotals[timeSlot] = reportData.reduce((sum, item) => sum + (item.hourlyProduction[timeSlot] || 0), 0);
    });
    
    console.log(`Final comprehensive target report data: ${reportData.length} items`);
    console.log(`Summary: ${summary.totalLines} lines, ${summary.totalTarget} total target, ${summary.totalProduction} total production`);
    console.log(`Time slot production totals:`, timeSlotTotals);
    
    const response = NextResponse.json({
      success: true,
      data: reportData,
      summary: summary,
      timeSlotHeaders: timeSlotHeaders,
      timeSlotTotals: timeSlotTotals
    });
    
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Error fetching comprehensive target report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message || 'Failed to fetch comprehensive target report' 
      },
      { status: 500 }
    );
  }
}
