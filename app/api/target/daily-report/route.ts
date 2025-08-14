import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET daily target report with production data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Parse date and create date range - handle timezone properly
    const startOfDay = new Date(date + 'T00:00:00');
    const endOfDay = new Date(date + 'T23:59:59.999');
    
    console.log(`API called with date: ${date}`);
    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    console.log(`Local date range: ${startOfDay.toLocaleString()} to ${endOfDay.toLocaleString()}`);
    
    // Also try a broader date range to catch timezone issues
    const broaderStartOfDay = new Date(date + 'T00:00:00Z');
    const broaderEndOfDay = new Date(date + 'T23:59:59.999Z');
    console.log(`Broader UTC date range: ${broaderStartOfDay.toISOString()} to ${broaderEndOfDay.toISOString()}`);

    // Get targets for the specific date
    console.log('Querying targets...');
    const targets = await prisma.target.findMany({
      where: {
        date: {
          gte: broaderStartOfDay,
          lte: broaderEndOfDay
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
    
    console.log(`Found ${targets.length} targets`);
    if (targets.length > 0) {
      console.log('Target details:');
      targets.forEach(target => {
        console.log(`  - Line: ${target.lineNo}, Style: ${target.styleNo}, Date: ${target.date.toISOString()}, Target: ${target.lineTarget}`);
      });
    }

    // Get production entries for the specific date
    console.log('Querying production entries...');
    const productionEntries = await prisma.productionEntry.findMany({
      where: {
        date: {
          gte: broaderStartOfDay,
          lte: broaderEndOfDay
        }
      },
      include: {
        line: true,
        style: true
      },
      orderBy: [
        { hourIndex: 'asc' },
        { lineId: 'asc' },
        { styleId: 'asc' }
      ]
    });
    
    console.log(`Found ${productionEntries.length} production entries`);
    if (productionEntries.length > 0) {
      console.log('Production entry details:');
      productionEntries.forEach(entry => {
        console.log(`  - Line: ${entry.line.code}, Style: ${entry.style.styleNumber}, Date: ${entry.date.toISOString()}, Hour: ${entry.hourIndex}, Output: ${entry.outputQty}`);
      });
    }

    // Get lines for reference
    const lines = await prisma.line.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });
    
    console.log(`Found ${lines.length} active lines`);
    if (lines.length > 0) {
      console.log('Lines:');
      lines.forEach(line => {
        console.log(`  - Code: ${line.code}, Name: ${line.name}, Active: ${line.isActive}`);
      });
    }

    // Get production list items for reference (these have the item field)
    const productionItems = await prisma.productionList.findMany({
      where: { 
        status: 'RUNNING'
      },
      orderBy: { styleNo: 'asc' }
    });
    
    console.log(`Found ${productionItems.length} production list items`);
    if (productionItems.length > 0) {
      console.log('Production list items:');
      productionItems.forEach(item => {
        console.log(`  - Style: ${item.styleNo}, Buyer: ${item.buyer}, Item: ${item.item}, Status: ${item.status}`);
      });
    }

    // Create a map of line codes to line names
    const lineMap = new Map(lines.map(line => [line.code, line.name]));
    
    // Create a map of style numbers to style details from production list
    const styleMap = new Map(productionItems.map(item => [item.styleNo, {
      buyer: item.buyer,
      item: item.item
    }]));
    
    console.log(`Created style map with ${styleMap.size} entries`);
    console.log('Style map contents:');
    styleMap.forEach((details, styleNo) => {
      console.log(`  - Style ${styleNo}: Buyer=${details.buyer}, Item=${details.item}`);
    });

    // Process targets and create report data
    console.log('\nProcessing targets to create report data...');
    const reportData = targets.map(target => {
      console.log(`Processing target: Line=${target.lineNo}, Style=${target.styleNo}, Target=${target.lineTarget}`);
      
      // Get production entries for this target
      const targetEntries = productionEntries.filter(entry => 
        entry.line.code === target.lineNo && 
        entry.style.styleNumber === target.styleNo
      );
      
      console.log(`  Found ${targetEntries.length} production entries for this target`);

      // Initialize hourly production object
      const hourlyProduction = {
        '8-9': 0,
        '9-10': 0,
        '10-11': 0,
        '11-12': 0,
        '12-1': 0,
        '1-2': 0,
        '2-3': 0,
        '3-4': 0,
        '4-5': 0,
        '5-6': 0,
        '6-7': 0,
        '7-8': 0,
      };

      // Map hour indices to display format and populate hourly production
      const hourMapping: { [key: number]: keyof typeof hourlyProduction } = {
        8: '8-9',
        9: '9-10',
        10: '10-11',
        11: '11-12',
        12: '12-1',
        13: '1-2',
        14: '2-3',
        15: '3-4',
        16: '4-5',
        17: '5-6',
        18: '6-7',
        19: '7-8',
      };

          // Calculate hourly production from entries
    targetEntries.forEach(entry => {
      const hourKey = hourMapping[entry.hourIndex];
      console.log(`Processing entry: hourIndex=${entry.hourIndex}, hourKey=${hourKey}, outputQty=${entry.outputQty}`);
      if (hourKey) {
        hourlyProduction[hourKey] += entry.outputQty || 0;
      } else {
        console.log(`Warning: No hour mapping found for hourIndex=${entry.hourIndex}`);
      }
    });

      // Calculate totals
      const totalProduction = Object.values(hourlyProduction).reduce((sum, val) => sum + val, 0);
      const averageProductionPerHour = totalProduction / 12; // 12 working hours

      // Get style details
      const styleDetails = styleMap.get(target.styleNo) || { buyer: 'N/A', item: 'N/A' };

      return {
        id: target.id,
        lineNo: target.lineNo,
        styleNo: target.styleNo,
        buyer: styleDetails.buyer,
        item: styleDetails.item,
        lineTarget: target.lineTarget,
        totalTarget: target.lineTarget * 12, // Assuming 12 working hours
        hourlyProduction,
        totalProduction,
        averageProductionPerHour
      };
    });

    // If no targets exist, create report data from production entries
    if (reportData.length === 0 && productionEntries.length > 0) {
      // Group entries by line and style
      const groupedEntries = new Map<string, any>();
      
      productionEntries.forEach(entry => {
        const key = `${entry.line.code}-${entry.style.styleNumber}`;
        if (!groupedEntries.has(key)) {
          groupedEntries.set(key, {
            lineNo: entry.line.code,
            styleNo: entry.style.styleNumber,
            buyer: entry.style.buyer,
            item: styleMap.get(entry.style.styleNumber)?.item || 'N/A',
            lineTarget: 0, // No target set
            totalTarget: 0,
            hourlyProduction: {
              '8-9': 0,
              '9-10': 0,
              '10-11': 0,
              '11-12': 0,
              '12-1': 0,
              '1-2': 0,
              '2-3': 0,
              '3-4': 0,
              '4-5': 0,
              '5-6': 0,
              '6-7': 0,
              '7-8': 0,
            },
            totalProduction: 0,
            averageProductionPerHour: 0
          });
        }
        
        const group = groupedEntries.get(key);
        const hourMapping: { [key: number]: keyof typeof group.hourlyProduction } = {
          8: '8-9',
          9: '9-10',
          10: '10-11',
          11: '11-12',
          12: '12-1',
          13: '1-2',
          14: '2-3',
          15: '3-4',
          16: '4-5',
          17: '5-6',
          18: '6-7',
          19: '7-8',
        };
        
        const hourKey = hourMapping[entry.hourIndex];
        if (hourKey) {
          group.hourlyProduction[hourKey] += entry.outputQty || 0;
        }
        group.totalProduction += entry.outputQty || 0;
      });

      // Calculate averages and add IDs
      groupedEntries.forEach((group, key) => {
        group.id = key;
                 group.averageProductionPerHour = group.totalProduction / 12;
      });

      reportData.push(...Array.from(groupedEntries.values()));
    }
    
    // If still no report data, create empty entries for targets to show them in the table
    if (reportData.length === 0 && targets.length > 0) {
      console.log('No production entries found, creating empty report entries for targets');
      
      targets.forEach(target => {
        const reportEntry = {
          id: target.id,
          lineNo: target.lineNo,
          styleNo: target.styleNo,
          buyer: target.productionList?.buyer || 'N/A',
          item: target.productionList?.item || 'N/A',
          lineTarget: target.lineTarget,
          totalTarget: target.lineTarget * 12, // 12 working hours
          hourlyProduction: {
            '8-9': 0,
            '9-10': 0,
            '10-11': 0,
            '11-12': 0,
            '12-1': 0,
            '1-2': 0,
            '2-3': 0,
            '3-4': 0,
            '4-5': 0,
            '5-6': 0,
            '6-7': 0,
            '7-8': 0,
          },
          totalProduction: 0,
          averageProductionPerHour: 0
        };
        
        reportData.push(reportEntry);
      });
    }
    
    // Always ensure targets are shown in the report, even if no production entries exist
    if (targets.length > 0 && reportData.length === 0) {
      console.log('Creating report entries for all targets to ensure they are displayed');
      
      targets.forEach(target => {
        const reportEntry = {
          id: target.id,
          lineNo: target.lineNo,
          styleNo: target.styleNo,
          buyer: target.productionList?.buyer || 'N/A',
          item: target.productionList?.item || 'N/A',
          lineTarget: target.lineTarget,
          totalTarget: target.lineTarget * 12, // 12 working hours
          hourlyProduction: {
            '8-9': 0,
            '9-10': 0,
            '10-11': 0,
            '11-12': 0,
            '12-1': 0,
            '1-2': 0,
            '2-3': 0,
            '3-4': 0,
            '4-5': 0,
            '5-6': 0,
            '6-7': 0,
            '7-8': 0,
          },
          totalProduction: 0,
          averageProductionPerHour: 0
        };
        
        reportData.push(reportEntry);
      });
    }

    console.log(`Final report data: ${reportData.length} items`);
    if (reportData.length > 0) {
      console.log('Report data sample:');
      reportData.slice(0, 2).forEach(item => {
        console.log(`  - Line: ${item.lineNo}, Style: ${item.styleNo}, Production: ${item.totalProduction}`);
      });
    }
    
    return NextResponse.json({
      success: true,
      data: reportData,
      summary: {
        totalLines: reportData.length,
        totalTarget: reportData.reduce((sum, item) => sum + item.totalTarget, 0),
        totalProduction: reportData.reduce((sum, item) => sum + item.totalProduction, 0),
        averageProductionPerHour: reportData.length > 0 
          ? reportData.reduce((sum, item) => sum + item.averageProductionPerHour, 0) / reportData.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching daily target report:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch daily target report' },
      { status: 500 }
    );
  }
}
