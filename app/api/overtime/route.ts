import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET overtime records for a specific date
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

    const dateString = date; // Use date string directly

    // Get overtime records for the specific date
    const overtimeRecords = await prisma.$queryRaw`
      SELECT 
        id, date, section, "workerCount", "otHours", "totalOtHours", remarks,
        "createdAt", "updatedAt"
      FROM overtime_records
      WHERE date::date = ${dateString}::date
      ORDER BY section ASC
    ` as any[];

    // Calculate summary
    const summary = {
      totalSections: overtimeRecords.length,
      totalWorkers: overtimeRecords.reduce((sum, record) => sum + Number(record.workerCount), 0),
      totalOtHours: overtimeRecords.reduce((sum, record) => sum + Number(record.totalOtHours), 0),
      averageOtHours: overtimeRecords.length > 0 
        ? Number((overtimeRecords.reduce((sum, record) => sum + Number(record.totalOtHours), 0) / overtimeRecords.length).toFixed(2))
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        records: overtimeRecords.map((record: any) => ({
          id: record.id,
          date: record.date.toISOString().split('T')[0],
          section: record.section,
          workerCount: Number(record.workerCount),
          otHours: Number(record.otHours),
          totalOtHours: Number(record.totalOtHours),
          remarks: record.remarks,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        })),
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching overtime records:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch overtime records: ${error}` },
      { status: 500 }
    );
  }
}

// POST create/update overtime records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, records } = body;

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'Date and records array are required' },
        { status: 400 }
      );
    }

    const dateString = date;

    // Clear existing records for this date
    await prisma.$executeRaw`
      DELETE FROM overtime_records WHERE date::date = ${dateString}::date
    `;

    // Insert new records
    let insertedCount = 0;
    const errors = [];

    for (const record of records) {
      try {
        const { section, workerCount, otHours, remarks } = record;
        
        if (!section || workerCount === undefined || otHours === undefined || 
            isNaN(Number(workerCount)) || isNaN(Number(otHours))) {
          errors.push(`Invalid record: ${JSON.stringify(record)}`);
          continue;
        }

        const workerCountVal = Number(workerCount) || 0;
        const otHoursVal = Number(otHours) || 0;
        const totalOtHours = workerCountVal * otHoursVal;
        const recordId = `overtime_${Date.now()}_${insertedCount}`;
        const recordDate = new Date(dateString + 'T12:00:00.000Z');
        const workerCountNum = workerCountVal;
        const otHoursNum = otHoursVal;
        const remarksText = remarks || '';

        await prisma.$queryRaw`
          INSERT INTO overtime_records (
            id, date, section, "workerCount", "otHours", "totalOtHours", remarks, "createdAt", "updatedAt"
          ) VALUES (
            ${recordId}, ${recordDate}, ${section}, ${workerCountNum}, ${otHoursNum}, ${totalOtHours}, 
            ${remarksText}, NOW(), NOW()
          )
        `;
        
        insertedCount++;
      } catch (error) {
        console.error('Error inserting overtime record:', error);
        errors.push(`Failed to insert ${record.section}: ${error}`);
      }
    }

    // Get summary of inserted data
    const summary = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::integer as total_records,
        SUM("workerCount")::integer as total_workers,
        SUM("totalOtHours")::numeric as total_ot_hours
      FROM overtime_records
      WHERE date::date = ${dateString}::date
    ` as any[];

    return NextResponse.json({
      success: insertedCount > 0,
      data: {
        date: dateString,
        insertedRecords: insertedCount,
        totalRecords: records.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 10),
        summary: {
          totalRecords: Number(summary[0]?.total_records || 0),
          totalWorkers: Number(summary[0]?.total_workers || 0),
          totalOtHours: Number(summary[0]?.total_ot_hours || 0)
        }
      },
      message: `Overtime records saved. ${insertedCount}/${records.length} records inserted successfully.`
    });

  } catch (error) {
    console.error('Error saving overtime records:', error);
    return NextResponse.json(
      { success: false, error: `Failed to save overtime records: ${error}` },
      { status: 500 }
    );
  }
}

// DELETE overtime records for a specific date
export async function DELETE(request: NextRequest) {
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

    // Get count before deletion
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*)::integer as count
      FROM overtime_records
      WHERE date::date = ${dateString}::date
    ` as any[];

    const recordCount = Number(countResult[0]?.count || 0);

    if (recordCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No overtime records found for the specified date' },
        { status: 404 }
      );
    }

    // Delete records
    await prisma.$executeRaw`
      DELETE FROM overtime_records 
      WHERE date::date = ${dateString}::date
    `;

    return NextResponse.json({
      success: true,
      data: {
        date: dateString,
        deletedRecords: recordCount
      },
      message: `Successfully deleted ${recordCount} overtime records for ${dateString}`
    });

  } catch (error) {
    console.error('Error deleting overtime records:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete overtime records: ${error}` },
      { status: 500 }
    );
  }
}
