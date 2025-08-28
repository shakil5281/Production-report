import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ProfitLossService } from '@/lib/services/profit-loss-service';

// GET /api/daily-production-report - Get daily production reports
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Daily Production Report API called');
    
    const user = await getCurrentUser(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ User authenticated:', { id: user.id, email: user.email, role: user.role });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const styleNo = searchParams.get('styleNo');
    const lineNo = searchParams.get('lineNo');

    let whereClause: any = {};
    let selectedDate: Date;
    let nextDay: Date;

    if (date) {
      // Parse date string (YYYY-MM-DD) using local timezone (same as target service)
      const [year, month, day] = date.split('-').map(Number);
      selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      nextDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      whereClause.date = {
        gte: selectedDate,
        lte: nextDay
      };
    } else {
      // Default to current date if no date provided
      const now = new Date();
      selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
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
    console.log('🔍 Fetching daily production reports with where clause:', JSON.stringify(whereClause));
    
    let reports;
    try {
      reports = await prisma.dailyProductionReport.findMany({
        where: whereClause,
        orderBy: [
          { date: 'desc' },
          { lineNo: 'asc' },
          { styleNo: 'asc' }
        ]
      });
      console.log(`📊 Found ${reports.length} daily production reports`);
    } catch (dbError) {
      console.error('❌ Database error fetching daily production reports:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database error while fetching production reports' },
        { status: 500 }
      );
    }

    // Get target data for the same date to calculate production hours FIRST
    console.log('🎯 Fetching target data for production hours calculation');
    
    let targets: Array<{
      lineNo: string;
      styleNo: string;
      lineTarget: number;
      inTime: string;
      outTime: string;
      hourlyProduction: number;
    }> = [];
    try {
      targets = await prisma.target.findMany({
        where: {
          date: {
            gte: selectedDate,
            lte: nextDay
          }
        },
        select: {
          lineNo: true,
          styleNo: true,
          lineTarget: true,
          inTime: true,
          outTime: true,
          hourlyProduction: true
        }
      });
      console.log(`🎯 Found ${targets.length} target records`);
    } catch (dbError) {
      console.error('❌ Database error fetching target data:', dbError);
      // Continue with empty targets if there's an error
      targets = [];
    }

    // Calculate production hours for each style/line combination
    const productionHoursMap = new Map<string, number>();
    targets.forEach(target => {
      const key = `${target.lineNo}-${target.styleNo}`;
      
      // Sum up all hours for the same line-style combination
      if (productionHoursMap.has(key)) {
        // If we already have hours for this line-style, add the new hours
        const existingHours = productionHoursMap.get(key)!;
        const inHour = parseInt(target.inTime.split(':')[0]);
        const outHour = parseInt(target.outTime.split(':')[0]);
        const newHours = Math.max(1, outHour - inHour); // Minimum 1 hour
        const totalHours = existingHours + newHours;
        productionHoursMap.set(key, totalHours);
        console.log(`⏰ Line ${target.lineNo}-Style ${target.styleNo}: ${existingHours}h + ${newHours}h = ${totalHours}h total`);
      } else {
        // First time seeing this line-style combination
        const inHour = parseInt(target.inTime.split(':')[0]);
        const outHour = parseInt(target.outTime.split(':')[0]);
        const hours = Math.max(1, outHour - inHour); // Minimum 1 hour
        productionHoursMap.set(key, hours);
        console.log(`⏰ Line ${target.lineNo}-Style ${target.styleNo}: ${hours}h (first entry)`);
      }
    });
    
    console.log('⏰ Final production hours map:', Object.fromEntries(productionHoursMap));

    // Get production list data for the styles in reports
    console.log('📋 Fetching production list data for styles:', reports.map(r => r.styleNo));
    
    let productionListData: Array<{
      styleNo: string;
      buyer: string;
      item: string;
      price: any; // Handle Prisma Decimal type
      totalQty: number;
      percentage: any; // Handle Prisma Decimal type
    }> = [];
    
    try {
      if (reports.length > 0) {
        const styleNumbers = [...new Set(reports.map(r => r.styleNo))];
        productionListData = await prisma.productionList.findMany({
          where: {
            styleNo: {
              in: styleNumbers
            }
          },
          select: {
            styleNo: true,
            buyer: true,
            item: true,
            price: true,
            totalQty: true,
            percentage: true
          }
        });
        console.log(`📋 Found ${productionListData.length} production list items`);
      } else {
        productionListData = [];
      }
    } catch (dbError) {
      console.error('❌ Database error fetching production list data:', dbError);
      productionListData = [];
    }

    // Create a map for quick lookup of production list data
    const productionListMap = new Map();
    productionListData.forEach(item => {
      productionListMap.set(item.styleNo, item);
    });

    // Combine the data manually - NOW productionHoursMap is defined
    const reportsWithProductionList = reports.map(report => {
      const key = `${report.lineNo}-${report.styleNo}`;
      const hours = productionHoursMap.get(key) || 1;
      const calculatedTargets = (report.targetQty || 0) * hours;
      
      console.log(`🎯 Report ${report.styleNo} on Line ${report.lineNo}: Target Qty ${report.targetQty} × ${hours}h = ${calculatedTargets} targets`);
      
      return {
        ...report,
        productionList: productionListMap.get(report.styleNo) || {
          buyer: 'Unknown',
          item: 'Unknown',
          price: 0,
          totalQty: 0,
          percentage: 0
        }
      };
    });

    // Group reports by line (only lines with actual production data)
    const reportsByLine = new Map<string, typeof reports>();
    const reportsWithoutLine: typeof reports = [];
    
    reportsWithProductionList.forEach(report => {
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
                 // Access percentage from the productionList that was added to the report
         const productionListData = (latestStyleReport as any).productionList;
         lineTotalPercentage += Number(productionListData?.percentage || 0);
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
    
    reportsWithProductionList.forEach(report => {
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
      // Access percentage from the productionList that was added to the report
      const productionListData = (latestStyleReport as any).productionList;
      overallTotalPercentage += Number(productionListData?.percentage || 0);
    });
    
    console.log(`🌍 Overall totals: Production=${overallTotalProductionQty}, Target=${overallTotalTargetQty}`);
    
    const overallSummary = {
      totalReports: reportsWithProductionList.length,
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
      allReports: reportsWithProductionList, // Keep original flat structure for compatibility
      productionHours: Object.fromEntries(productionHoursMap) // Add production hours data
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error fetching daily production reports:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check for specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Database error code:', (error as any).code);
      console.error('Database error detail:', (error as any).detail);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch daily production reports',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
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
