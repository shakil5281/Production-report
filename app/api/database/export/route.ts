import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { format as formatDate } from 'date-fns';

// GET /api/database/export - Export database data
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const tables = searchParams.get('tables')?.split(',') || [];

    // Define all available tables
    const availableTables = [
      'users',
      'factories',
      'lines',
      'styles',
      'productionList',
      'targets',
      'dailyProductionReport',
      'productionEntries',
      'expenseCategories',
      'expenses',
      'salaryEntries',
      'cashbookEntries',
      'dailySalaries',
      'monthlyExpense',
      'monthlyAttendanceReport',
      'overtimeRecords',
      'userPermissions',
      'employees',
      'dailyAttendance',
      'manpowerSummary',
      'shipments'
    ];

    // If no specific tables requested, export all
    const tablesToExport = tables.length > 0 ? tables : availableTables;

    const exportData: any = {
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: user.email,
        format: format,
        tables: tablesToExport,
        version: '1.0'
      },
      data: {}
    };

    // Export each table
    for (const table of tablesToExport) {
      try {
        let tableData = [];
        
        switch (table) {
          case 'users':
            tableData = await prisma.user.findMany({
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
              }
            });
            break;
            
          case 'factories':
            tableData = await prisma.factory.findMany();
            break;
            
          case 'lines':
            tableData = await prisma.line.findMany();
            break;
            
          case 'styles':
            tableData = await prisma.style.findMany();
            break;
            
          case 'productionList':
            tableData = await prisma.productionList.findMany({
              include: {
                dailyReports: true,
                targets: true
              }
            });
            break;
            
          case 'targets':
            tableData = await prisma.target.findMany();
            break;
            
          case 'dailyProductionReport':
            tableData = await prisma.dailyProductionReport.findMany();
            break;
            
          case 'productionEntries':
            tableData = await prisma.productionEntry.findMany();
            break;
            
          case 'expenseCategories':
            tableData = await prisma.expenseCategory.findMany();
            break;
            
          case 'expenses':
            tableData = await prisma.expense.findMany({
              include: {
                category: true,
                line: true
              }
            });
            break;
            
          case 'salaryEntries':
            tableData = await prisma.salaryEntry.findMany();
            break;
            
          case 'cashbookEntries':
            tableData = await prisma.cashbookEntry.findMany();
            break;
            
          case 'dailySalaries':
            tableData = await prisma.dailySalary.findMany();
            break;
            
          case 'monthlyExpense':
            tableData = await prisma.monthlyExpense.findMany();
            break;
            
          case 'monthlyAttendanceReport':
            tableData = await prisma.monthlyAttendanceReport.findMany();
            break;
            
          case 'overtimeRecords':
            tableData = await prisma.overtimeRecord.findMany();
            break;
            
          case 'userPermissions':
            tableData = await prisma.userPermission.findMany({
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true
                  }
                }
              }
            });
            break;
            
          case 'employees':
            tableData = await prisma.employee.findMany();
            break;
            
          case 'dailyAttendance':
            tableData = await prisma.dailyAttendance.findMany();
            break;
            
          case 'manpowerSummary':
            tableData = await prisma.manpowerSummary.findMany();
            break;
            
          case 'shipments':
            tableData = await prisma.shipment.findMany();
            break;
            
          default:
            console.warn(`Unknown table: ${table}`);
            continue;
        }
        
        exportData.data[table] = tableData;
        console.log(`Exported ${tableData.length} records from ${table}`);
        
      } catch (error) {
        console.error(`Error exporting table ${table}:`, error);
        exportData.data[table] = {
          error: `Failed to export table: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    // Generate filename
    const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `database_export_${timestamp}.${format}`;

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else if (format === 'csv') {
      // Convert to CSV format (simplified - would need more complex logic for nested objects)
      const csvData = convertToCSV(exportData);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported format. Use json or csv.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error exporting database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export database' },
      { status: 500 }
    );
  }
}

// Helper function to convert data to CSV format
function convertToCSV(data: any): string {
  const lines: string[] = [];
  
  // Add metadata
  lines.push('Table,Field,Value');
  lines.push(`metadata,exportDate,"${data.metadata.exportDate}"`);
  lines.push(`metadata,exportedBy,"${data.metadata.exportedBy}"`);
  lines.push(`metadata,format,"${data.metadata.format}"`);
  lines.push('');
  
  // Add data for each table
  for (const [tableName, tableData] of Object.entries(data.data)) {
    if (Array.isArray(tableData) && tableData.length > 0) {
      // Get headers from first record
      const headers = Object.keys(tableData[0]);
      lines.push(`# Table: ${tableName}`);
      lines.push(headers.join(','));
      
      // Add data rows
      for (const record of tableData as any[]) {
        const values = headers.map(header => {
          const value = record[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          if (typeof value === 'string' && value.includes(',')) return `"${value.replace(/"/g, '""')}"`;
          return value;
        });
        lines.push(values.join(','));
      }
      lines.push('');
    }
  }
  
  return lines.join('\n');
}
