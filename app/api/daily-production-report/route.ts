import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ProfitLossService } from '@/lib/services/profit-loss-service';

// GET /api/daily-production-report - Get daily production reports
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Date parameter is required' 
      }, { status: 400 });
    }

    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause for date filtering
    const whereClause = {
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    };

    // Fetch daily production reports
    const reports = await prisma.dailyProductionReport.findMany({
      where: whereClause,
      orderBy: [
        { lineNo: 'asc' },
        { styleNo: 'asc' }
      ]
    });

    if (reports.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          allReports: [],
          reportsByLine: {},
          reportsWithoutLine: [],
          lineSummaries: {},
          overallSummary: null,
          productionHours: {}
        }
      });
    }

    // Fetch target data for production hours calculation
    const targets = await prisma.target.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        lineNo: true,
        styleNo: true,
        lineTarget: true,
        hourlyProduction: true
      }
    });

    // Calculate production hours for each line-style combination
    const productionHoursMap = new Map<string, number>();
    
    targets.forEach(target => {
      const key = `${target.lineNo}-${target.styleNo}`;
      const existingHours = productionHoursMap.get(key) || 0;
      const newHours = target.hourlyProduction || 0;
      const totalHours = existingHours + newHours;
      productionHoursMap.set(key, totalHours);
    });

    // Fetch production list data for styles
    const styleNumbers = [...new Set(reports.map(r => r.styleNo))];
    const productionListData = await prisma.productionList.findMany({
      where: {
        styleNo: { in: styleNumbers }
      },
      select: {
        styleNo: true,
        buyer: true,
        item: true
      }
    });

    // Create a map for quick lookup
    const productionListMap = new Map(
      productionListData.map(item => [item.styleNo, item])
    );

    // Process reports and calculate targets
    const processedReports = reports.map(report => {
      const productionList = productionListMap.get(report.styleNo);
      const hours = productionHoursMap.get(`${report.lineNo}-${report.styleNo}`) || 0;
      const calculatedTargets = report.targetQty * hours;

      return {
        ...report,
        productionList,
        calculatedTargets
      };
    });

    // Group reports by line
    const reportsByLine: Record<string, any[]> = {};
    const reportsWithoutLine: any[] = [];

    processedReports.forEach(report => {
      if (report.lineNo) {
        if (!reportsByLine[report.lineNo]) {
          reportsByLine[report.lineNo] = [];
        }
        reportsByLine[report.lineNo].push(report);
      } else {
        reportsWithoutLine.push(report);
      }
    });

    // Calculate line summaries
    const lineSummaries: Record<string, any> = {};
    
    Object.entries(reportsByLine).forEach(([lineNo, lineReports]) => {
      const styleGroups = new Map<string, any[]>();
      
      lineReports.forEach(report => {
        if (!styleGroups.has(report.styleNo)) {
          styleGroups.set(report.styleNo, []);
        }
        styleGroups.get(report.styleNo)!.push(report);
      });

      let lineTotalProductionQty = 0;
      let lineTotalTargetQty = 0;

      styleGroups.forEach((styleReports, styleNo) => {
        const latestStyleReport = styleReports[styleReports.length - 1];
        lineTotalProductionQty += latestStyleReport.productionQty;
        lineTotalTargetQty += latestStyleReport.targetQty;
      });

      lineSummaries[lineNo] = {
        totalProductionQty: lineTotalProductionQty,
        totalTargetQty: lineTotalTargetQty,
        efficiency: lineTotalTargetQty > 0 
          ? Math.round((lineTotalProductionQty / lineTotalTargetQty) * 100) 
          : 0
      };
    });

    // Calculate overall summary
    const overallStyleGroups = new Map<string, any[]>();
    
    processedReports.forEach(report => {
      if (!overallStyleGroups.has(report.styleNo)) {
        overallStyleGroups.set(report.styleNo, []);
      }
      overallStyleGroups.get(report.styleNo)!.push(report);
    });

    let overallTotalProductionQty = 0;
    let overallTotalTargetQty = 0;

    overallStyleGroups.forEach((styleReports, styleNo) => {
      const latestStyleReport = styleReports[styleReports.length - 1];
      overallTotalProductionQty += latestStyleReport.productionQty;
      overallTotalTargetQty += latestStyleReport.targetQty;
    });

    const overallSummary = {
      totalProductionQty: overallTotalProductionQty,
      totalTargetQty: overallTotalTargetQty,
      efficiency: overallTotalTargetQty > 0 
        ? Math.round((overallTotalProductionQty / overallTotalTargetQty) * 100) 
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        allReports: processedReports,
        reportsByLine,
        reportsWithoutLine,
        lineSummaries,
        overallSummary,
        productionHours: Object.fromEntries(productionHoursMap)
      }
    });

  } catch (error) {
    console.error('Error in daily production report API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
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
    const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

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
    
    // Find existing report for the same date, style, and line
    const existingReport = await prisma.dailyProductionReport.findFirst({
      where: {
        date: {
          gte: reportDate,
          lte: nextDay
        },
        styleNo: styleNo,
        lineNo: lineNo
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

    // Calculate total amount (Production Qty * Unit Price)
    const totalAmount = (updatedProductionQty || 0) * Number(finalUnitPrice || 0);
    
    // Calculate net amount (Total Amount * percentage % * 120) in BDT
    const netAmount = totalAmount * (Number(productionItem.percentage || 0) / 100) * 120;
    
    const reportData = {
      date: reportDate,
      styleNo,
      targetQty: updatedTargetQty,
      productionQty: updatedProductionQty,
      unitPrice: finalUnitPrice,
      totalAmount: totalAmount,
      netAmount: netAmount,
      lineNo: lineNo || null,
      notes: notes || null
    };

    let report;
    if (existingReport) {
      // Update existing report
      report = await prisma.dailyProductionReport.update({
        where: {
          id: existingReport.id
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

    // Update Profit & Loss Statement automatically
    try {
      await ProfitLossService.handleProfitLossUpdate({
        date: date,
        type: 'PRODUCTION',
        action: existingReport ? 'UPDATE' : 'CREATE',
        recordId: report.id
      });
    } catch (error) {
      console.warn('Failed to update Profit & Loss Statement:', error);
      // Continue with production update even if P&L update fails
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
