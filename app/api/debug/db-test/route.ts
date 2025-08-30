import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Debug endpoint to test database queries
export async function GET() {
  try {
    // Test database connection and basic queries
    const allTargets = await prisma.target.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    const allProductionEntries = await prisma.productionEntry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        line: true,
        style: true
      }
    });

    // Test specific date query
    const testDate = '2025-08-14';
    const startOfDay = new Date(testDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(testDate);
    endOfDay.setHours(23, 59, 59, 999);

    const targetsForDate = await prisma.target.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const entriesForDate = await prisma.productionEntry.findMany({
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

    // Get total counts
    const totalTargets = await prisma.target.count();
    const totalProductionEntries = await prisma.productionEntry.count();
    const totalLines = await prisma.line.count();
    const totalStyles = await prisma.style.count();

    return NextResponse.json({
      success: true,
      data: {
        targets: allTargets,
        productionEntries: allProductionEntries,
        targetsForDate,
        entriesForDate,
        totals: {
          targets: totalTargets,
          productionEntries: totalProductionEntries,
          lines: totalLines,
          styles: totalStyles
        }
      }
    });

  } catch (error) {
    console.error('Error in database test:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database test failed' 
    }, { status: 500 });
  }
}
