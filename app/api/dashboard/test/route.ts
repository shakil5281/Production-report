import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test basic database connection
    const testQuery = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Test if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('production_entries', 'style_assignments', 'cashbook_entries')
    `;
    
    // Test basic count queries
    const productionCount = await prisma.productionEntry.count();
    const styleAssignmentCount = await prisma.styleAssignment.count();
    const cashbookCount = await prisma.cashbookEntry.count();
    
    return NextResponse.json({
      success: true,
      databaseConnection: 'OK',
      testQuery,
      availableTables: tables,
      counts: {
        productionEntries: productionCount,
        styleAssignments: styleAssignmentCount,
        cashbookEntries: cashbookCount
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
