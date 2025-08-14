import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Debug endpoint to test database queries
export async function GET(request: NextRequest) {
  try {
    console.log('=== DATABASE DEBUG TEST ===');
    
    // Test 1: Check all targets
    console.log('\n1. Checking all targets...');
    const allTargets = await prisma.target.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${allTargets.length} targets (showing latest 5):`);
    allTargets.forEach(target => {
      console.log(`  - ID: ${target.id}, Line: ${target.lineNo}, Style: ${target.styleNo}, Date: ${target.date.toISOString()}`);
    });
    
    // Test 2: Check all production entries
    console.log('\n2. Checking all production entries...');
    const allProductionEntries = await prisma.productionEntry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${allProductionEntries.length} production entries (showing latest 5):`);
    allProductionEntries.forEach(entry => {
      console.log(`  - ID: ${entry.id}, Line: ${entry.lineId}, Style: ${entry.styleId}, Date: ${entry.date.toISOString()}, Hour: ${entry.hourIndex}`);
    });
    
    // Test 3: Check specific date (2025-08-14)
    console.log('\n3. Checking specific date 2025-08-14...');
    const testDate = '2025-08-14';
    const startOfDay = new Date(testDate + 'T00:00:00');
    const endOfDay = new Date(testDate + 'T23:59:59.999');
    
    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    
    const targetsForDate = await prisma.target.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    console.log(`Found ${targetsForDate.length} targets for ${testDate}`);
    
    const entriesForDate = await prisma.productionEntry.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    console.log(`Found ${entriesForDate.length} production entries for ${testDate}`);
    
    // Test 4: Check if there are any targets or entries at all
    console.log('\n4. Checking total counts...');
    const totalTargets = await prisma.target.count();
    const totalProductionEntries = await prisma.productionEntry.count();
    const totalLines = await prisma.line.count();
    const totalStyles = await prisma.style.count();
    
    console.log(`Total targets: ${totalTargets}`);
    console.log(`Total production entries: ${totalProductionEntries}`);
    console.log(`Total lines: ${totalLines}`);
    console.log(`Total styles: ${totalStyles}`);
    
    return NextResponse.json({
      success: true,
      data: {
        totalTargets,
        totalProductionEntries,
        totalLines,
        totalStyles,
        recentTargets: allTargets,
        recentProductionEntries: allProductionEntries,
        targetsForDate: targetsForDate.length,
        entriesForDate: entriesForDate.length,
        testDate,
        dateRange: {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to debug database' },
      { status: 500 }
    );
  }
}
