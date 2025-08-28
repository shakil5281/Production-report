import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { ProfitLossService } from '@/lib/services/profit-loss-service';

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
    const startOfDay = new Date(dateString + 'T00:00:00Z');
    const endOfDay = new Date(dateString + 'T23:59:59Z');

    // Get daily salary records for the specific date using Prisma ORM
    const salaryRecords = await prisma.dailySalary.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: [
        {
          section: 'asc'
        }
      ]
    });

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
        records: salaryRecords.map((record) => ({
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
    const startOfDay = new Date(dateString + 'T00:00:00Z');
    const endOfDay = new Date(dateString + 'T23:59:59Z');

    // Get overtime data from overtime management if auto-calculation is enabled
    let overtimeDataBySection: Record<string, number> = {};
    
    if (autoCalculateOvertime) {
      try {
        // Query overtime data using Prisma ORM
        const overtimeData = await prisma.overtimeRecord.findMany({
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          select: {
            section: true,
            totalOtHours: true
          }
        });

        overtimeData.forEach((record) => {
          overtimeDataBySection[record.section] = Number(record.totalOtHours) || 0;
        });
      } catch (error) {
        console.warn('Could not fetch overtime data for auto-calculation:', error);
      }
    }

    // Clear existing records for this date
    await prisma.dailySalary.deleteMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

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
        
        const recordDate = new Date(dateString + 'T12:00:00.000Z');

        await prisma.dailySalary.create({
          data: {
            date: recordDate,
            section: section,
            workerCount: workerCountVal,
            regularRate: regularRateVal,
            overtimeHours: overtimeHoursVal,
            overtimeRate: overtimeRateVal,
            regularAmount: regularAmount,
            overtimeAmount: overtimeAmount,
            totalAmount: totalAmount,
            remarks: remarks || ''
          }
        });
        
        insertedCount++;
      } catch (error) {
        console.error('Error inserting salary record:', error);
        errors.push(`Failed to insert ${record.section}: ${error}`);
      }
    }

    // Update Profit & Loss Statement automatically
    try {
      await ProfitLossService.handleProfitLossUpdate({
        date: dateString,
        type: 'SALARY',
        action: 'UPDATE',
        recordId: `salary_${dateString}`
      });
    } catch (error) {
      console.warn('Failed to update Profit & Loss Statement:', error);
      // Continue with salary update even if P&L update fails
    }

    // Get summary of inserted data
    const summary = await prisma.dailySalary.aggregate({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _count: {
        id: true
      },
      _sum: {
        workerCount: true,
        totalAmount: true,
        regularAmount: true,
        overtimeAmount: true
      }
    });

    return NextResponse.json({
      success: insertedCount > 0,
      data: {
        date: dateString,
        insertedRecords: insertedCount,
        totalRecords: records.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 10),
        summary: {
          totalRecords: summary._count.id || 0,
          totalWorkers: Number(summary._sum.workerCount || 0),
          grandTotalAmount: Number(summary._sum.totalAmount || 0),
          totalRegularAmount: Number(summary._sum.regularAmount || 0),
          totalOvertimeAmount: Number(summary._sum.overtimeAmount || 0)
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
    const startOfDay = new Date(dateString + 'T00:00:00Z');
    const endOfDay = new Date(dateString + 'T23:59:59Z');

    // Get count before deletion
    const countResult = await prisma.dailySalary.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (countResult === 0) {
      return NextResponse.json(
        { success: false, error: 'No salary records found for the specified date' },
        { status: 404 }
      );
    }

    // Delete records
    await prisma.dailySalary.deleteMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Update Profit & Loss Statement automatically
    try {
      await ProfitLossService.handleProfitLossUpdate({
        date: dateString,
        type: 'SALARY',
        action: 'DELETE',
        recordId: `salary_${dateString}`
      });
    } catch (error) {
      console.warn('Failed to update Profit & Loss Statement:', error);
      // Continue with salary deletion even if P&L update fails
    }

    return NextResponse.json({
      success: true,
      data: {
        date: dateString,
        deletedRecords: countResult
      },
      message: `Successfully deleted ${countResult} salary records for ${dateString}`
    });

  } catch (error) {
    console.error('Error deleting salary records:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete salary records: ${error}` },
      { status: 500 }
    );
  }
}
