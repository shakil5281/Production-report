import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Debug endpoint to test comprehensive report relationships
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '2025-08-14';

    const formattedDate = date;

    // Fetch data for the specified date
    const targets = await prisma.target.findMany({
      where: {
        date: {
          gte: new Date(formattedDate + 'T00:00:00'),
          lte: new Date(formattedDate + 'T23:59:59.999')
        }
      }
    });

    const productionEntries = await prisma.productionEntry.findMany({
      where: {
        date: {
          gte: new Date(formattedDate + 'T00:00:00'),
          lte: new Date(formattedDate + 'T23:59:59.999')
        }
      },
      include: {
        line: true,
        style: true
      }
    });

    const lines = await prisma.line.findMany({
      where: { isActive: true }
    });

    const styles = await prisma.style.findMany();

    // Test matching logic
    const testResults = targets.map(target => {
      const lineId = lines.find(line => line.code === target.lineNo)?.id;
      const styleId = styles.find(style => style.styleNumber === target.styleNo)?.id;

      const matchingEntries = productionEntries.filter(entry => 
        entry.lineId === lineId && entry.styleId === styleId
      );

      return {
        targetId: target.id,
        lineNo: target.lineNo,
        styleNo: target.styleNo,
        lineId,
        styleId,
        matchingEntries: matchingEntries.length,
        entries: matchingEntries.map(entry => ({
          hour: entry.hourIndex,
          output: entry.outputQty
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        date: formattedDate,
        targets: targets.length,
        productionEntries: productionEntries.length,
        lines: lines.length,
        styles: styles.length,
        testResults
      }
    });

  } catch (error) {
    console.error('Error in comprehensive report test:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed' 
    }, { status: 500 });
  }
}
