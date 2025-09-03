import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/database/status - Get database status and statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get database statistics
    const stats = await getDatabaseStatistics();
    
    // Test database connection
    const connectionStatus = await testDatabaseConnection();

    return NextResponse.json({
      success: true,
      data: {
        status: connectionStatus,
        statistics: stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting database status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get database status' },
      { status: 500 }
    );
  }
}

// Helper function to get database statistics
async function getDatabaseStatistics() {
  try {
    const [
      userCount,
      factoryCount,
      lineCount,
      styleCount,
      productionListCount,
      targetCount,
      dailyProductionReportCount,
      productionEntryCount,
      expenseCategoryCount,
      expenseCount,
      salaryEntryCount,
      cashbookEntryCount,
      dailySalaryCount,
      monthlyExpenseCount,
      monthlyAttendanceReportCount,
      overtimeRecordCount,
      userPermissionCount,
      employeeCount,
      dailyAttendanceCount,
      manpowerSummaryCount,
      shipmentCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.factory.count(),
      prisma.line.count(),
      prisma.style.count(),
      prisma.productionList.count(),
      prisma.target.count(),
      prisma.dailyProductionReport.count(),
      prisma.productionEntry.count(),
      prisma.expenseCategory.count(),
      prisma.expense.count(),
      prisma.salaryEntry.count(),
      prisma.cashbookEntry.count(),
      prisma.dailySalary.count(),
      prisma.monthlyExpense.count(),
      prisma.monthlyAttendanceReport.count(),
      prisma.overtimeRecord.count(),
      prisma.userPermission.count(),
      prisma.employee.count(),
      prisma.dailyAttendance.count(),
      prisma.manpowerSummary.count(),
      prisma.shipment.count()
    ]);

    return {
      users: userCount,
      factories: factoryCount,
      lines: lineCount,
      styles: styleCount,
      productionList: productionListCount,
      targets: targetCount,
      dailyProductionReports: dailyProductionReportCount,
      productionEntries: productionEntryCount,
      expenseCategories: expenseCategoryCount,
      expenses: expenseCount,
      salaryEntries: salaryEntryCount,
      cashbookEntries: cashbookEntryCount,
      dailySalaries: dailySalaryCount,
      monthlyExpenses: monthlyExpenseCount,
      monthlyAttendanceReports: monthlyAttendanceReportCount,
      overtimeRecords: overtimeRecordCount,
      userPermissions: userPermissionCount,
      employees: employeeCount,
      dailyAttendance: dailyAttendanceCount,
      manpowerSummary: manpowerSummaryCount,
      shipments: shipmentCount,
      totalRecords: userCount + factoryCount + lineCount + styleCount + 
                   productionListCount + targetCount + dailyProductionReportCount + 
                   productionEntryCount + expenseCategoryCount + expenseCount + 
                   salaryEntryCount + cashbookEntryCount + dailySalaryCount + 
                   monthlyExpenseCount + monthlyAttendanceReportCount + 
                   overtimeRecordCount + userPermissionCount + employeeCount +
                   dailyAttendanceCount + manpowerSummaryCount + shipmentCount
    };
  } catch (error) {
    console.error('Error getting database statistics:', error);
    return {
      error: 'Failed to get statistics',
      totalRecords: 0
    };
  }
}

// Helper function to test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}
