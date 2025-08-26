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

    // Get daily production reports for the specified date
    const reports = await prisma.dailyProductionReport.findMany({
      where: whereClause,
      include: {
        productionList: {
          select: {
            buyer: true,
            item: true,
            price: true,
            totalQty: true,
            percentage: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { lineNo: 'asc' },
        { styleNo: 'asc' }
      ]
    });

    // Group reports by line (only lines with actual production data)
    const reportsByLine = new Map<string, typeof reports>();
    const reportsWithoutLine: typeof reports = [];
    
    reports.forEach(report => {
      if (report.lineNo) {
        if (!reportsByLine.has(report.lineNo)) {
          reportsByLine.set(report.lineNo, []);
        }
        reportsByLine.get(report.lineNo)!.push(report);
      } else {
        reportsWithoutLine.push(report);
      }
    });

    // Show ALL lines that have reports (regardless of production quantity)
    const activeReportsByLine = new Map<string, typeof reports>();
    reportsByLine.forEach((lineReports, lineNo) => {
      // Show line if it has any reports, regardless of production quantity
      activeReportsByLine.set(lineNo, lineReports);
    });

    // Calculate line-wise summaries (only for active lines)
    const lineSummaries = new Map<string, any>();
    activeReportsByLine.forEach((lineReports, lineNo) => {
      console.log(`🔍 Processing Line ${lineNo} with ${lineReports.length} reports`);
      
      // Group reports by style number to avoid accumulating production across styles
      const styleGroups = new Map<string, typeof lineReports>();
      
      lineReports.forEach(report => {
        if (!styleGroups.has(report.styleNo)) {
          styleGroups.set(report.styleNo, []);
        }
        styleGroups.get(report.styleNo)!.push(report);
      });
      
      console.log(`   📊 Line ${lineNo} has ${styleGroups.size} unique styles: ${Array.from(styleGroups.keys()).join(', ')}`);
      
      // Calculate totals for each style separately, then sum for the line
      let lineTotalTargetQty = 0;
      let lineTotalProductionQty = 0;
      let lineTotalAmount = 0;
      let lineTotalNetAmount = 0;
      let lineTotalUnitPrice = 0;
      let lineTotalPercentage = 0;
      
      styleGroups.forEach((styleReports, styleNo) => {
        // For each style, use the latest report or sum if multiple entries for same style
        const latestStyleReport = styleReports[styleReports.length - 1];
        
        console.log(`   🎯 Style ${styleNo}: Production=${latestStyleReport.productionQty}, Target=${latestStyleReport.targetQty}`);
        
        lineTotalTargetQty += latestStyleReport.targetQty || 0;
        lineTotalProductionQty += latestStyleReport.productionQty || 0;
        lineTotalAmount += Number(latestStyleReport.totalAmount || 0);
        lineTotalNetAmount += Number(latestStyleReport.netAmount || 0);
        lineTotalUnitPrice += Number(latestStyleReport.unitPrice || 0);
        lineTotalPercentage += Number(latestStyleReport.productionList?.percentage || 0);
      });
      
      console.log(`   📈 Line ${lineNo} totals: Production=${lineTotalProductionQty}, Target=${lineTotalTargetQty}`);
      
      const lineSummary = {
        lineNo,
        totalReports: lineReports.length,
        totalTargetQty: lineTotalTargetQty,
        totalProductionQty: lineTotalProductionQty,
        totalAmount: lineTotalAmount,
        totalNetAmount: lineTotalNetAmount,
        totalUnitPrice: lineTotalUnitPrice,
        totalPercentage: lineTotalPercentage,
        averagePercentage: styleGroups.size > 0 ? lineTotalPercentage / styleGroups.size : 0,
        averageEfficiency: styleGroups.size > 0 ? 
          Array.from(styleGroups.values()).reduce((sum, styleReports) => {
            const latestReport = styleReports[styleReports.length - 1];
            const target = latestReport.targetQty || 0;
            const production = latestReport.productionQty || 0;
            return sum + (target > 0 ? (production / target * 100) : 0);
          }, 0) / styleGroups.size : 0,
      };
      lineSummaries.set(lineNo, lineSummary);
    });

    // Calculate overall summary statistics
    // Group reports by style number to avoid accumulating production across styles
    const overallStyleGroups = new Map<string, typeof reports>();
    
    reports.forEach(report => {
      if (!overallStyleGroups.has(report.styleNo)) {
        overallStyleGroups.set(report.styleNo, []);
      }
      overallStyleGroups.get(report.styleNo)!.push(report);
    });
    
    console.log(`🌍 Overall summary: ${overallStyleGroups.size} unique styles across all lines`);
    
    let overallTotalTargetQty = 0;
    let overallTotalProductionQty = 0;
    let overallTotalAmount = 0;
    let overallTotalNetAmount = 0;
    let overallTotalUnitPrice = 0;
    let overallTotalPercentage = 0;
    
    overallStyleGroups.forEach((styleReports, styleNo) => {
      // For each style, use the latest report
      const latestStyleReport = styleReports[styleReports.length - 1];
      
      console.log(`   🌍 Style ${styleNo}: Production=${latestStyleReport.productionQty}, Target=${latestStyleReport.targetQty}`);
      
      overallTotalTargetQty += latestStyleReport.targetQty || 0;
      overallTotalProductionQty += latestStyleReport.productionQty || 0;
      overallTotalAmount += Number(latestStyleReport.totalAmount || 0);
      overallTotalNetAmount += Number(latestStyleReport.netAmount || 0);
      overallTotalUnitPrice += Number(latestStyleReport.unitPrice || 0);
      overallTotalPercentage += Number(latestStyleReport.productionList?.percentage || 0);
    });
    
    console.log(`🌍 Overall totals: Production=${overallTotalProductionQty}, Target=${overallTotalTargetQty}`);
    
    const overallSummary = {
      totalReports: reports.length,
      totalTargetQty: overallTotalTargetQty,
      totalProductionQty: overallTotalProductionQty,
      totalAmount: overallTotalAmount,
      totalNetAmount: overallTotalNetAmount,
      totalUnitPrice: overallTotalUnitPrice,
      totalPercentage: overallTotalPercentage,
      averagePercentage: overallStyleGroups.size > 0 ? overallTotalPercentage / overallStyleGroups.size : 0,
      averageEfficiency: overallStyleGroups.size > 0 ? 
        Array.from(overallStyleGroups.values()).reduce((sum, styleReports) => {
          const latestReport = styleReports[styleReports.length - 1];
          const target = latestReport.targetQty || 0;
          const production = latestReport.productionQty || 0;
          return sum + (target > 0 ? (production / target * 100) : 0);
        }, 0) / overallStyleGroups.size : 0,
      totalLines: activeReportsByLine.size,
      linesWithProduction: Array.from(activeReportsByLine.keys()).filter(lineNo => {
        const lineReports = activeReportsByLine.get(lineNo)!;
        return lineReports.some(report => report.productionQty > 0);
      }).length
    };

    // Prepare structured response with line grouping (only active lines)
    const responseData = {
      reportsByLine: Object.fromEntries(activeReportsByLine),
      reportsWithoutLine,
      lineSummaries: Object.fromEntries(lineSummaries),
      overallSummary,
      allReports: reports // Keep original flat structure for compatibility
    };

    return NextResponse.json({
      success: true,
      data: responseData
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
