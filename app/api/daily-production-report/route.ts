import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/daily-production-report - Get daily production reports
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const styleNo = searchParams.get('styleNo');
    const lineNo = searchParams.get('lineNo');

    let whereClause: any = {};

    if (date) {
      // Parse date string (YYYY-MM-DD) using local timezone (same as target service)
      const [year, month, day] = date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const nextDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      whereClause.date = {
        gte: selectedDate,
        lte: nextDay
      };
    }

    if (styleNo) {
      whereClause.styleNo = styleNo;
    }

    if (lineNo) {
      whereClause.lineNo = lineNo;
    }

    const reports = await prisma.dailyProductionReport.findMany({
      where: whereClause,
      include: {
        productionList: {
          select: {
            buyer: true,
            item: true,
            price: true,
            totalQty: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { styleNo: 'asc' }
      ]
    });

    // Calculate summary statistics
    const summary = {
      totalReports: reports.length,
      totalTargetQty: reports.reduce((sum, report) => sum + (report.targetQty || 0), 0),
      totalProductionQty: reports.reduce((sum, report) => sum + (report.productionQty || 0), 0),
      totalAmount: reports.reduce((sum, report) => sum + Number(report.totalAmount || 0), 0),
      totalNetAmount: reports.reduce((sum, report) => sum + Number(report.netAmount || 0), 0),
      averageEfficiency: reports.length > 0 ? 
        reports.reduce((sum, report) => {
          const target = report.targetQty || 0;
          const production = report.productionQty || 0;
          return sum + (target > 0 ? (production / target * 100) : 0);
        }, 0) / reports.length : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        reports,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching daily production reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch daily production reports' },
      { status: 500 }
    );
  }
}

// POST /api/daily-production-report - Create/Update daily production report
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      date, 
      styleNo, 
      lineNo, 
      targetQty, 
      productionQty, 
      unitPrice, 
      notes,
      action = 'ADD' // ADD, SUBTRACT, REPLACE
    } = body;

    // Validation
    if (!date || !styleNo || !targetQty || productionQty === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: date, styleNo, targetQty, productionQty' },
        { status: 400 }
      );
    }

    // Parse date string (YYYY-MM-DD) using local timezone (same as target service)
    const [year, month, day] = date.split('-').map(Number);
    const reportDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    // Check if production list item exists
    const productionItem = await prisma.productionList.findUnique({
      where: { styleNo }
    });

    if (!productionItem) {
      return NextResponse.json(
        { success: false, error: 'Production item not found' },
        { status: 404 }
      );
    }

    // Get the unit price from production list if not provided
    const finalUnitPrice = unitPrice || productionItem.price;
    
    // Find existing report for the same date and style
    const existingReport = await prisma.dailyProductionReport.findUnique({
      where: {
        date_styleNo: {
          date: reportDate,
          styleNo: styleNo
        }
      }
    });

    let updatedProductionQty = productionQty;
    let updatedTargetQty = targetQty;

    if (existingReport) {
      // Handle different actions
      switch (action) {
        case 'ADD':
          updatedProductionQty = existingReport.productionQty + productionQty;
          updatedTargetQty = Math.max(existingReport.targetQty, targetQty);
          break;
        case 'SUBTRACT':
          updatedProductionQty = Math.max(0, existingReport.productionQty - productionQty);
          updatedTargetQty = existingReport.targetQty;
          break;
        case 'REPLACE':
          updatedProductionQty = productionQty;
          updatedTargetQty = targetQty;
          break;
      }
    }

    // Calculate total amount (productionQty * unitPrice * 120 as per schema comment)
    const totalAmount = (updatedProductionQty || 0) * Number(finalUnitPrice || 0) * 120;
    
    // Calculate net amount (totalAmount * percentage * 120)
    const netAmount = totalAmount * Number(productionItem.percentage || 0) * 120;
    
    // Calculate balance quantity (total available - produced)
    const balanceQty = Math.max(0, (productionItem.totalQty || 0) - (updatedProductionQty || 0));

    const reportData = {
      date: reportDate,
      styleNo,
      targetQty: updatedTargetQty,
      productionQty: updatedProductionQty,
      unitPrice: finalUnitPrice,
      totalAmount: totalAmount,
      netAmount: netAmount,
      balanceQty: balanceQty,
      lineNo: lineNo || null,
      notes: notes || null
    };

    let report;
    if (existingReport) {
      // Update existing report
      report = await prisma.dailyProductionReport.update({
        where: {
          date_styleNo: {
            date: reportDate,
            styleNo: styleNo
          }
        },
        data: reportData,
        include: {
          productionList: true
        }
      });
    } else {
      // Create new report
      report = await prisma.dailyProductionReport.create({
        data: reportData,
        include: {
          productionList: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
      message: existingReport ? 'Production report updated successfully' : 'Production report created successfully'
    }, { status: existingReport ? 200 : 201 });

  } catch (error) {
    console.error('Error managing daily production report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage daily production report' },
      { status: 500 }
    );
  }
}
