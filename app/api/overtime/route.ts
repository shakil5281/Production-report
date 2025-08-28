import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

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

    // Get overtime records for the specific date using Prisma ORM
    const startOfDay = new Date(dateString + 'T00:00:00Z');
    const endOfDay = new Date(dateString + 'T23:59:59Z');
    
    const overtimeRecords = await prisma.overtimeRecord.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        section: 'asc'
      }
    });

    // Calculate summary
    const totalPresentWorkers = overtimeRecords.reduce((sum, record) => sum + Number(record.presentWorkers), 0);
    const totalOtHours = overtimeRecords.reduce((sum, record) => sum + Number(record.totalOtHours), 0);

    const summary = {
      totalSections: overtimeRecords.length,
      totalPresentWorkers,
      totalWorkers: overtimeRecords.reduce((sum, record) => sum + Number(record.totalWorkers), 0),
      totalOtHours,
      averageOtHours: totalPresentWorkers > 0 
        ? Number((totalOtHours / totalPresentWorkers).toFixed(2))
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        records: overtimeRecords.map((record) => ({
          id: record.id,
          date: record.date.toISOString().split('T')[0],
          section: record.section,
          presentWorkers: Number(record.presentWorkers),
          totalWorkers: Number(record.totalWorkers),
          overtimeDetails: Array.isArray(record.overtimeDetails) ? record.overtimeDetails : [],
          totalOtHours: Number(record.totalOtHours),
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

    // Clear existing records for this date using Prisma ORM
    const startOfDay = new Date(dateString + 'T00:00:00Z');
    const endOfDay = new Date(dateString + 'T23:59:59Z');
    
    await prisma.overtimeRecord.deleteMany({
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
        const { section, presentWorkers, totalWorkers, overtimeDetails } = record;
        
        if (!section || presentWorkers === undefined || totalWorkers === undefined) {
          errors.push(`Invalid record: ${JSON.stringify(record)}`);
          continue;
        }

        const presentWorkersNum = Number(presentWorkers) || 0;
        const totalWorkersNum = Number(totalWorkers) || 0;
        
        // Calculate total overtime hours from details
        let totalOtHours = 0;
        if (overtimeDetails && Array.isArray(overtimeDetails)) {
          totalOtHours = overtimeDetails.reduce((sum, detail) => {
            return sum + (Number(detail.workerCount) * Number(detail.hours));
          }, 0);
        }

        // Use randomUUID() for better ID generation
        const recordId = randomUUID();
        const recordDate = new Date(dateString + 'T12:00:00.000Z');
        
        // Ensure we always have valid JSON data
        let validDetails: any[];
        try {
          validDetails = Array.isArray(overtimeDetails) ? overtimeDetails : [];
        } catch (e) {
          console.warn('Failed to process overtimeDetails, using empty array');
          validDetails = [];
        }

        // Use Prisma ORM instead of raw SQL for better JSON handling
        await prisma.overtimeRecord.create({
          data: {
            id: recordId,
            date: recordDate,
            section: section,
            presentWorkers: presentWorkersNum,
            totalWorkers: totalWorkersNum,
            overtimeDetails: validDetails, // Direct JSON object, not string
            totalOtHours: totalOtHours
          }
        });
        
        insertedCount++;
      } catch (error) {
        console.error('Error inserting overtime record:', error);
        errors.push(`Failed to insert ${record.section}: ${error}`);
      }
    }

    // Get summary of inserted data using Prisma aggregation
    const summaryData = await prisma.overtimeRecord.aggregate({
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
        presentWorkers: true,
        totalWorkers: true,
        totalOtHours: true
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
          totalRecords: summaryData._count.id || 0,
          totalPresentWorkers: Number(summaryData._sum.presentWorkers || 0),
          totalWorkers: Number(summaryData._sum.totalWorkers || 0),
          totalOtHours: Number(summaryData._sum.totalOtHours || 0)
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
    const startOfDay = new Date(dateString + 'T00:00:00Z');
    const endOfDay = new Date(dateString + 'T23:59:59Z');
    
    const countResult = await prisma.overtimeRecord.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (countResult === 0) {
      return NextResponse.json(
        { success: false, error: 'No overtime records found for the specified date' },
        { status: 404 }
      );
    }

    // Delete records
    await prisma.overtimeRecord.deleteMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        date: dateString,
        deletedRecords: countResult
      },
      message: `Successfully deleted ${countResult} overtime records for ${dateString}`
    });

  } catch (error) {
    console.error('Error deleting overtime records:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete overtime records: ${error}` },
      { status: 500 }
    );
  }
}
