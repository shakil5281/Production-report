import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET overtime hours aggregated by section for salary calculation
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

    const dateString = date;

    // Get overtime records and aggregate hours by section
    const overtimeData = await prisma.$queryRaw`
      SELECT 
        section,
        "totalOtHours" as total_overtime_hours,
        "presentWorkers" as present_workers,
        "totalWorkers" as total_workers
      FROM overtime_records
      WHERE date::date = ${dateString}::date
      ORDER BY section ASC
    ` as any[];

    // Transform data for salary calculation
    const sectionOvertimeHours: Record<string, {
      totalHours: number;
      presentWorkers: number;
      totalWorkers: number;
    }> = {};

    overtimeData.forEach((record: any) => {
      sectionOvertimeHours[record.section] = {
        totalHours: Number(record.total_overtime_hours) || 0,
        presentWorkers: Number(record.present_workers) || 0,
        totalWorkers: Number(record.total_workers) || 0
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        date: dateString,
        sectionOvertimeHours,
        hasOvertimeData: overtimeData.length > 0
      }
    });

  } catch (error) {
    console.error('Error fetching overtime data for salary integration:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch overtime data: ${error}` },
      { status: 500 }
    );
  }
}
