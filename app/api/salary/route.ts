import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

// GET daily salary records for a specific date
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

    // Get daily salary records for the specific date
    const salaryRecords = await prisma.$queryRaw`
      SELECT 
        id, date, section, "workerCount", "regularRate", "overtimeHours", "overtimeRate",
        "regularAmount", "overtimeAmount", "totalAmount", remarks,
        "createdAt", "updatedAt"
      FROM daily_salaries
      WHERE date::date = ${dateString}::date
      ORDER BY 
        CASE section
          WHEN 'Staff' THEN 1
          WHEN 'Operator' THEN 2
          WHEN 'Helper' THEN 3
          WHEN 'Cutting' THEN 4
          WHEN 'Finishing' THEN 5
          WHEN 'Quality' THEN 6
          WHEN 'Security' THEN 7
          ELSE 8
        END,
        section ASC
    ` as any[];

    // Calculate summary
    const summary = {
      totalSections: salaryRecords.length,
      totalWorkers: salaryRecords.reduce((sum, record) => sum + Number(record.workerCount), 0),
      totalRegularAmount: salaryRecords.reduce((sum, record) => sum + Number(record.regularAmount), 0),
      totalOvertimeAmount: salaryRecords.reduce((sum, record) => sum + Number(record.overtimeAmount), 0),
      grandTotalAmount: salaryRecords.reduce((sum, record) => sum + Number(record.totalAmount), 0),
      totalOvertimeHours: salaryRecords.reduce((sum, record) => sum + Number(record.overtimeHours), 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        records: salaryRecords.map((record: any) => ({
          id: record.id,
          date: record.date.toISOString().split('T')[0],
          section: record.section,
          workerCount: Number(record.workerCount),
          regularRate: Number(record.regularRate),
          overtimeHours: Number(record.overtimeHours),
          overtimeRate: Number(record.overtimeRate),
          regularAmount: Number(record.regularAmount),
          overtimeAmount: Number(record.overtimeAmount),
          totalAmount: Number(record.totalAmount),
          remarks: record.remarks,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
        })),
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching salary records:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch salary records: ${error}` },
      { status: 500 }
    );
  }
}

// POST create/update daily salary records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, records, autoCalculateOvertime = true } = body;

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'Date and records array are required' },
        { status: 400 }
      );
    }

    const dateString = date;

    // Get overtime data from overtime management if auto-calculation is enabled
    let overtimeDataBySection: Record<string, number> = {};
    
    if (autoCalculateOvertime) {
      try {
        // Query overtime data directly from database
        const overtimeData = await prisma.$queryRaw`
          SELECT 
            section,
            "totalOtHours" as total_overtime_hours
          FROM overtime_records
          WHERE date::date = ${dateString}::date
        ` as any[];

        overtimeData.forEach((record: any) => {
          overtimeDataBySection[record.section] = Number(record.total_overtime_hours) || 0;
        });
      } catch (error) {
        console.warn('Could not fetch overtime data for auto-calculation:', error);
      }
    }

    // Clear existing records for this date
    await prisma.$executeRaw`
      DELETE FROM daily_salaries WHERE date::date = ${dateString}::date
    `;

    // Insert new records
    let insertedCount = 0;
    const errors = [];

    for (const record of records) {
      try {
        const { 
          section, 
          workerCount, 
          regularRate, 
          overtimeHours, 
          overtimeRate, 
          remarks 
        } = record;
        
        if (!section || workerCount === undefined || regularRate === undefined || 
            isNaN(Number(workerCount)) || isNaN(Number(regularRate))) {
          errors.push(`Invalid record: ${JSON.stringify(record)}`);
          continue;
        }

        // Calculate amounts with proper number validation
        const workerCountVal = Number(workerCount) || 0;
        const regularRateVal = Number(regularRate) || 0;
        
        // Use overtime hours from overtime management if available, otherwise use provided value
        let overtimeHoursVal = Number(overtimeHours) || 0;
        if (autoCalculateOvertime && overtimeDataBySection[section] !== undefined) {
          overtimeHoursVal = overtimeDataBySection[section];
        }
        
        const overtimeRateVal = Number(overtimeRate) || 0;
        
        const regularAmount = workerCountVal * regularRateVal;
        const overtimeAmount = overtimeHoursVal * overtimeRateVal;
        const totalAmount = regularAmount + overtimeAmount;
        
        const recordId = randomUUID();
        const recordDate = new Date(dateString + 'T12:00:00.000Z');
        const workerCountNum = workerCountVal;
        const regularRateNum = regularRateVal;
        const overtimeHoursNum = overtimeHoursVal;
        const overtimeRateNum = overtimeRateVal;
        const remarksText = remarks || '';

        await prisma.$queryRaw`
          INSERT INTO daily_salaries (
            id, date, section, "workerCount", "regularRate", "overtimeHours", "overtimeRate",
            "regularAmount", "overtimeAmount", "totalAmount", remarks, "createdAt", "updatedAt"
          ) VALUES (
            ${recordId}, ${recordDate}, ${section}, ${workerCountNum}, ${regularRateNum}, ${overtimeHoursNum}, 
            ${overtimeRateNum}, ${regularAmount}, ${overtimeAmount}, ${totalAmount},
            ${remarksText}, NOW(), NOW()
          )
        `;
        
        insertedCount++;
      } catch (error) {
        console.error('Error inserting salary record:', error);
        errors.push(`Failed to insert ${record.section}: ${error}`);
      }
    }

    // Get summary of inserted data
    const summary = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::integer as total_records,
        SUM("workerCount")::integer as total_workers,
        SUM("totalAmount")::numeric as grand_total_amount,
        SUM("regularAmount")::numeric as total_regular_amount,
        SUM("overtimeAmount")::numeric as total_overtime_amount
      FROM daily_salaries
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
          grandTotalAmount: Number(summary[0]?.grand_total_amount || 0),
          totalRegularAmount: Number(summary[0]?.total_regular_amount || 0),
          totalOvertimeAmount: Number(summary[0]?.total_overtime_amount || 0)
        }
      },
      message: `Daily salary records saved. ${insertedCount}/${records.length} records inserted successfully.`
    });

  } catch (error) {
    console.error('Error saving salary records:', error);
    return NextResponse.json(
      { success: false, error: `Failed to save salary records: ${error}` },
      { status: 500 }
    );
  }
}

// DELETE salary records for a specific date
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
      FROM daily_salaries
      WHERE date::date = ${dateString}::date
    ` as any[];

    const recordCount = Number(countResult[0]?.count || 0);

    if (recordCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No salary records found for the specified date' },
        { status: 404 }
      );
    }

    // Delete records
    await prisma.$executeRaw`
      DELETE FROM daily_salaries 
      WHERE date::date = ${dateString}::date
    `;

    return NextResponse.json({
      success: true,
      data: {
        date: dateString,
        deletedRecords: recordCount
      },
      message: `Successfully deleted ${recordCount} salary records for ${dateString}`
    });

  } catch (error) {
    console.error('Error deleting salary records:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete salary records: ${error}` },
      { status: 500 }
    );
  }
}
