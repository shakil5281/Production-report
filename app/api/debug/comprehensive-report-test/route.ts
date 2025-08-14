import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Debug endpoint to test comprehensive report relationships
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Default to current date if no date provided
    const currentDate = new Date();
    const date = dateParam ? new Date(dateParam) : currentDate;
    
    // Format date for logging
    const formattedDate = date.toISOString().split('T')[0];
    
    console.log(`Debug Comprehensive Report Test for date: ${formattedDate}`);
    
    // Create date range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all targets for the specific date
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

    // Get production entries for the same date
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
    
    // Get lines
    const lines = await prisma.line.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });
    
    // Get styles
    const styles = await prisma.style.findMany({
      orderBy: { styleNumber: 'asc' }
    });
    
    console.log(`Found ${targets.length} targets`);
    console.log(`Found ${productionEntries.length} production entries`);
    console.log(`Found ${lines.length} lines`);
    console.log(`Found ${styles.length} styles`);
    
    // Debug targets
    console.log('=== TARGETS ===');
    targets.forEach(target => {
      console.log(`Target: LineNo=${target.lineNo}, StyleNo=${target.styleNo}, LineTarget=${target.lineTarget}`);
    });
    
    // Debug lines
    console.log('=== LINES ===');
    lines.forEach(line => {
      console.log(`Line: ID=${line.id}, Code=${line.code}, Name=${line.name}`);
    });
    
    // Debug styles
    console.log('=== STYLES ===');
    styles.forEach(style => {
      console.log(`Style: ID=${style.id}, StyleNumber=${style.styleNumber}, Buyer=${style.buyer}`);
    });
    
    // Debug production entries
    console.log('=== PRODUCTION ENTRIES ===');
    productionEntries.forEach(entry => {
      console.log(`Production: LineID=${entry.lineId}, StyleID=${entry.styleId}, HourIndex=${entry.hourIndex}, OutputQty=${entry.outputQty}`);
      console.log(`  Line: ${entry.line?.code} (${entry.line?.name})`);
      console.log(`  Style: ${entry.style?.styleNumber}`);
    });
    
    // Test matching logic
    console.log('=== MATCHING TEST ===');
    targets.forEach(target => {
      // Find line by code
      const line = lines.find(l => l.code === target.lineNo);
      const lineId = line?.id;
      
      // Find style by styleNumber
      const style = styles.find(s => s.styleNumber === target.styleNo);
      const styleId = style?.id;
      
      console.log(`Target ${target.styleNo}:`);
      console.log(`  LineNo: ${target.lineNo} -> LineID: ${lineId} (${line?.name})`);
      console.log(`  StyleNo: ${target.styleNo} -> StyleID: ${styleId}`);
      
      // Find matching production entries
      const matchingEntries = productionEntries.filter(entry => 
        entry.lineId === lineId && entry.styleId === styleId
      );
      
      console.log(`  Matching production entries: ${matchingEntries.length}`);
      matchingEntries.forEach(entry => {
        console.log(`    Hour ${entry.hourIndex}: ${entry.outputQty} output`);
      });
    });
    
    return NextResponse.json({
      success: true,
      debug: {
        targets: targets.length,
        productionEntries: productionEntries.length,
        lines: lines.length,
        styles: styles.length,
        targetsData: targets.map(t => ({
          lineNo: t.lineNo,
          styleNo: t.styleNo,
          lineTarget: t.lineTarget
        })),
        linesData: lines.map(l => ({
          id: l.id,
          code: l.code,
          name: l.name
        })),
        stylesData: styles.map(s => ({
          id: s.id,
          styleNumber: s.styleNumber,
          buyer: s.buyer
        })),
        productionData: productionEntries.map(p => ({
          lineId: p.lineId,
          styleId: p.styleId,
          hourIndex: p.hourIndex,
          outputQty: p.outputQty,
          lineCode: p.line?.code,
          styleNumber: p.style?.styleNumber
        }))
      }
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message || 'Failed to debug comprehensive report' 
      },
      { status: 500 }
    );
  }
}
