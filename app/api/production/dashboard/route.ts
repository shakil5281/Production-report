import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/production/dashboard - Get daily production dashboard data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const date = new Date(dateParam);

    // Get all active lines
    const lines = await prisma.line.findMany({
      where: { isActive: true },
      include: {

        styleAssignments: {
          where: {
            startDate: { lte: date },
            OR: [
              { endDate: null },
              { endDate: { gte: date } }
            ]
          },
          include: {
            style: true
          }
        }
      },
      orderBy: { code: 'asc' }
    });

    // Get production data for the date
    const productionData = await prisma.productionEntry.findMany({
      where: {
        date: date
      },
      include: {
        line: true,
        style: true
      }
    });

    // Calculate daily totals and status for each line/style combination
    const dashboardData = lines.map(line => {
      const lineData = {
        line: {
          id: line.id,
          name: line.name,
          code: line.code
        },
        styles: line.styleAssignments.map(assignment => {
          const style = assignment.style;
          
          // Get production data for this style on this line for the date
          const styleProduction = productionData.filter(
            entry => entry.lineId === line.id && entry.styleId === style.id
          );

          // Calculate totals for each stage
          const cuttingData = styleProduction.filter(entry => entry.stage === 'CUTTING');
          const sewingData = styleProduction.filter(entry => entry.stage === 'SEWING');
          const finishingData = styleProduction.filter(entry => entry.stage === 'FINISHING');

          const cuttingInput = cuttingData.reduce((sum, entry) => sum + entry.inputQty, 0);
          const cuttingOutput = cuttingData.reduce((sum, entry) => sum + entry.outputQty, 0);
          const sewingInput = sewingData.reduce((sum, entry) => sum + entry.inputQty, 0);
          const sewingOutput = sewingData.reduce((sum, entry) => sum + entry.outputQty, 0);
          const finishingInput = finishingData.reduce((sum, entry) => sum + entry.inputQty, 0);
          const finishingOutput = finishingData.reduce((sum, entry) => sum + entry.outputQty, 0);

          // Calculate WIP (Work in Progress)
          const cuttingWIP = cuttingInput - cuttingOutput;
          const sewingWIP = sewingInput - sewingOutput;
          const finishingWIP = finishingInput - finishingOutput;

          // Determine status based on production progress
          let status = 'PENDING';
          if (finishingOutput > 0) {
            if (finishingOutput >= style.orderQty) {
              status = 'COMPLETE';
            } else {
              status = 'RUNNING';
            }
          } else if (sewingOutput > 0 || cuttingOutput > 0) {
            status = 'RUNNING';
          } else if (date > assignment.startDate) {
            status = 'WAITING';
          }

          return {
            id: style.id,
            styleNumber: style.styleNumber,
            buyer: style.buyer,
            poNumber: style.poNumber,
            orderQty: style.orderQty,
            unitPrice: style.unitPrice,
            plannedStart: assignment.startDate,
            plannedEnd: assignment.endDate,
            targetPerHour: assignment.targetPerHour,
            status,
            production: {
              cutting: { input: cuttingInput, output: cuttingOutput, wip: cuttingWIP },
              sewing: { input: sewingInput, output: sewingOutput, wip: sewingWIP },
              finishing: { input: finishingInput, output: finishingOutput, wip: finishingWIP }
            },
            dailyProgress: {
              totalInput: cuttingInput + sewingInput + finishingInput,
              totalOutput: cuttingOutput + sewingOutput + finishingOutput,
              totalDefects: styleProduction.reduce((sum, entry) => sum + entry.defectQty, 0),
              totalRework: styleProduction.reduce((sum, entry) => sum + entry.reworkQty, 0)
            }
          };
        })
      };

      return lineData;
    });

    // Calculate summary statistics
    const summary = {
      totalLines: lines.length,
      totalStyles: lines.reduce((sum, line) => sum + line.styleAssignments.length, 0),
      byStatus: {
        running: 0,
        pending: 0,
        complete: 0,
        waiting: 0
      }
    };

    dashboardData.forEach(line => {
      line.styles.forEach(style => {
        const statusKey = style.status.toLowerCase() as keyof typeof summary.byStatus;
        summary.byStatus[statusKey]++;
      });
    });

    return NextResponse.json({
      date: dateParam,
      summary,
      lines: dashboardData
    });
  } catch (error) {
    console.error('Error fetching production dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
