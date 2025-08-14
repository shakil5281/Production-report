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

    // Get production entries for the same date to show actual production
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
      },
      orderBy: [
        { lineId: 'asc' },
        { hourIndex: 'asc' }
      ]
    });
    
    console.log(`Found ${targets.length} targets for date ${formattedDate}`);
    console.log(`Found ${productionEntries.length} production entries for date ${formattedDate}`);
    
    // Get lines for reference
    const lines = await prisma.line.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });
    
    // Create a map of line codes to line names
    const lineMap = new Map(lines.map(line => [line.code, line.name]));
    
    // Group targets by line number only (combine all targets for same line)
    const lineGroups = new Map();
    
                    // Collect all unique time slots for dynamic headers
                const uniqueTimeSlots = new Set<string>();
    
    targets.forEach(target => {
      console.log(`Processing target: Line=${target.lineNo}, Style=${target.styleNo}, Target=${target.lineTarget}, InTime=${target.inTime}, OutTime=${target.outTime}`);
      
      const lineKey = target.lineNo;
      
      // Add time slot to unique set
      const timeSlot = `${target.inTime || '08:00'}-${target.outTime || '20:00'}`;
      uniqueTimeSlots.add(timeSlot);
      
      if (!lineGroups.has(lineKey)) {
        lineGroups.set(lineKey, {
          lineNo: target.lineNo,
          lineName: lineMap.get(target.lineNo) || 'Unknown Line',
          targets: [],
          totalLineTarget: 0,
                                styles: new Set<string>(),
                      buyers: new Set<string>(),
                      items: new Set<string>(),
                                timeSlots: new Set<string>() // Track all time slots for this line
        });
      }
      
      const group = lineGroups.get(lineKey);
      group.targets.push(target);
      group.totalLineTarget += target.lineTarget;
      group.styles.add(target.styleNo);
      group.buyers.add(target.productionList?.buyer || 'N/A');
      group.items.add(target.productionList?.item || 'N/A');
      group.timeSlots.add(timeSlot);
    });
    
    // Convert unique time slots to sorted array for headers
    const sortedTimeSlots = Array.from(uniqueTimeSlots).sort((a: string, b: string) => {
      const aStart = parseInt(a.split('-')[0].split(':')[0]);
      const bStart = parseInt(b.split('-')[0].split(':')[0]);
      return aStart - bStart;
    });
    
    console.log(`Unique time slots found: ${sortedTimeSlots.join(', ')}`);
    
    // Process grouped data and create report
    const reportData: any[] = [];
    
    lineGroups.forEach((group, lineKey) => {
      console.log(`Processing line ${lineKey}, Total targets: ${group.totalLineTarget}, Time slots: ${Array.from(group.timeSlots).join(', ')}`);
      
      // Create dynamic hourly production object based on actual time slots
      const hourlyProduction: Record<string, number> = {};
      
      // Initialize all time slots with 0
      sortedTimeSlots.forEach(timeSlot => {
        hourlyProduction[timeSlot] = 0;
      });
      
      // Get actual production data for this line
      const lineProductionEntries = productionEntries.filter(entry => entry.line?.code === lineKey);
      console.log(`Line ${lineKey} has ${lineProductionEntries.length} production entries`);
      
      // Get buyer and item from the first production entry's style for this line
      let lineBuyer = 'N/A';
      let lineItem = 'N/A';
      if (lineProductionEntries.length > 0) {
        lineBuyer = lineProductionEntries[0].style?.buyer || 'N/A';
        lineItem = lineProductionEntries[0].style?.styleNumber || 'N/A';
      }
      
      // Map production entries to time slots based on hourIndex
      lineProductionEntries.forEach(entry => {
        const hourIndex = entry.hourIndex;
        let timeSlot = '';
        
        // Map hourIndex to time slot format
        switch(hourIndex) {
          case 8: timeSlot = '08:00-09:00'; break;
          case 9: timeSlot = '09:00-10:00'; break;
          case 10: timeSlot = '10:00-11:00'; break;
          case 11: timeSlot = '11:00-12:00'; break;
          case 12: timeSlot = '12:00-13:00'; break;
          case 13: timeSlot = '13:00-14:00'; break;
          case 14: timeSlot = '14:00-15:00'; break;
          case 15: timeSlot = '15:00-16:00'; break;
          case 16: timeSlot = '16:00-17:00'; break;
          case 17: timeSlot = '17:00-18:00'; break;
          case 18: timeSlot = '18:00-19:00'; break;
          case 19: timeSlot = '19:00-20:00'; break;
          default: timeSlot = '08:00-09:00'; break;
        }
        
        if (hourlyProduction.hasOwnProperty(timeSlot)) {
          hourlyProduction[timeSlot] += entry.outputQty;
          console.log(`Line ${lineKey}: Added ${entry.outputQty} to time slot ${timeSlot} (hourIndex: ${hourIndex})`);
        }
      });
      
      // Calculate totals
      const totalProduction = Object.values(hourlyProduction).reduce((sum: number, val: number) => sum + val, 0);
      console.log(`Line ${lineKey} hourly production:`, hourlyProduction);
      const timeSlotsArray = Array.from(group.timeSlots) as string[];
      const totalWorkingHours = timeSlotsArray.reduce((sum: number, timeSlot: string) => {
        const [start, end] = timeSlot.split('-');
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        return sum + Math.max(1, endHour - startHour);
      }, 0);
      
      const averageProductionPerHour = totalWorkingHours > 0 ? totalProduction / totalWorkingHours : 0;
      
      // Get style details (use production data for buyer and item, targets for style numbers)
      const buyer = lineBuyer;
      const item = lineItem;
      const styleNo = Array.from(group.styles).join(', ');
      
      reportData.push({
        id: lineKey,
        lineNo: group.lineNo,
        lineName: group.lineName,
        styleNo: styleNo,
        buyer: buyer,
        item: item,
        lineTarget: group.totalLineTarget,
        totalTarget: group.totalLineTarget,
        timeSlots: Array.from(group.timeSlots),
        workingHours: totalWorkingHours,
        hourlyProduction,
        totalProduction,
        averageProductionPerHour,
        targetCount: group.targets.length,
        timeSlotHeaders: sortedTimeSlots
      });
    });
    
    // If no targets found, return empty report
    if (reportData.length === 0) {
      console.log('No targets found for the specified date');
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
    
    // Calculate summary statistics
    const summary = {
      totalLines: reportData.length,
      totalTarget: reportData.reduce((sum, item) => sum + item.totalTarget, 0),
      totalProduction: reportData.reduce((sum, item) => sum + item.totalProduction, 0),
      averageProductionPerHour: reportData.length > 0 
        ? reportData.reduce((sum, item) => sum + item.averageProductionPerHour, 0) / reportData.length 
        : 0,
      date: formattedDate
    };
    
    console.log(`Final comprehensive report data: ${reportData.length} items`);
    console.log(`Summary: ${summary.totalLines} lines, ${summary.totalTarget} total target, ${summary.totalProduction} total production`);
    
    return NextResponse.json({
      success: true,
      data: reportData,
      summary: summary,
      timeSlotHeaders: sortedTimeSlots
    });
    
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
