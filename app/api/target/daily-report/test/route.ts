import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Test endpoint to debug daily target report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '2025-08-14';
    
    console.log(`Testing daily target report for date: ${date}`);

    // Parse date and create date range
    const startOfDay = new Date(date + 'T00:00:00Z');
    const endOfDay = new Date(date + 'T23:59:59Z');

    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Get targets for the specific date
    const targets = await prisma.target.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        productionList: true
      }
    });

    console.log(`Found ${targets.length} targets`);

    // Get production entries for the specific date
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

    console.log(`Found ${productionEntries.length} production entries`);

    // Log each production entry
    productionEntries.forEach(entry => {
      console.log(`Entry: line=${entry.line.code}, style=${entry.style.styleNumber}, hourIndex=${entry.hourIndex}, outputQty=${entry.outputQty}`);
    });

    // Test hour mapping
    const hourMapping: { [key: number]: string } = {
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

    console.log('Hour mapping:');
    Object.entries(hourMapping).forEach(([index, display]) => {
      console.log(`  ${index} -> ${display}`);
    });

    return NextResponse.json({
      success: true,
      data: {
        date,
        targets: targets.length,
        productionEntries: productionEntries.length,
        entries: productionEntries.map(entry => ({
          line: entry.line.code,
          style: entry.style.styleNumber,
          hourIndex: entry.hourIndex,
          outputQty: entry.outputQty,
          mappedHour: hourMapping[entry.hourIndex] || 'UNMAPPED'
        })),
        hourMapping
      }
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to test daily target report' },
      { status: 500 }
    );
  }
}
