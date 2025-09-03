import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/database/import - Import database data
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string || 'merge'; // 'merge' or 'replace'
    const tables = formData.get('tables') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['json', 'csv'].includes(fileExtension || '')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format. Please use JSON or CSV files.' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    let importData: any;

    try {
      if (fileExtension === 'json') {
        importData = JSON.parse(fileContent);
      } else if (fileExtension === 'csv') {
        importData = parseCSV(fileContent);
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please check your file.' },
        { status: 400 }
      );
    }

    // Validate import data structure
    if (!importData.metadata || !importData.data) {
      return NextResponse.json(
        { success: false, error: 'Invalid import file format. Missing metadata or data section.' },
        { status: 400 }
      );
    }

    const results = {
      success: true,
      imported: 0,
      errors: 0,
      details: {} as Record<string, any>
    };

    // Determine which tables to import
    const tablesToImport = tables ? tables.split(',') : Object.keys(importData.data);
    
    // Sort tables by dependency order to avoid foreign key constraint errors
    const sortedTables = sortTablesByDependency(tablesToImport);
    
    // Import each table
    for (const tableName of sortedTables) {
      if (!importData.data[tableName]) {
        results.details[tableName] = { error: 'Table not found in import data' };
        results.errors++;
        continue;
      }

      try {
        const tableData = importData.data[tableName];
        
        if (Array.isArray(tableData)) {
          const result = await importTableData(tableName, tableData, mode);
          results.details[tableName] = result;
          results.imported += result.imported || 0;
          results.errors += result.errors || 0;
        } else if (tableData.error) {
          results.details[tableName] = { error: tableData.error };
          results.errors++;
        } else {
          results.details[tableName] = { error: 'Invalid table data format' };
          results.errors++;
        }
      } catch (error) {
        console.error(`Error importing table ${tableName}:`, error);
        results.details[tableName] = { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
        results.errors++;
      }
    }

    return NextResponse.json({
      success: results.errors === 0,
      message: `Import completed. ${results.imported} records imported, ${results.errors} errors.`,
      results
    });

  } catch (error) {
    console.error('Error importing database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import database' },
      { status: 500 }
    );
  }
}

// Helper function to sort tables by dependency order
function sortTablesByDependency(tables: string[]): string[] {
  // Define the dependency order (tables that other tables depend on should come first)
  const dependencyOrder = [
    'users',
    'factories', 
    'expenseCategories',
    'styles',
    'lines',
    'productionList',
    'targets',
    'employees',
    'dailyProductionReport',
    'productionEntries',
    'expenses',
    'salaryEntries',
    'cashbookEntries',
    'dailySalaries',
    'monthlyExpense',
    'monthlyAttendanceReport',
    'overtimeRecords',
    'userPermissions',
    'dailyAttendance',
    'manpowerSummary',
    'shipments'
  ];
  
  // Sort the input tables according to the dependency order
  const sorted = tables.sort((a, b) => {
    const indexA = dependencyOrder.indexOf(a);
    const indexB = dependencyOrder.indexOf(b);
    
    // If both tables are in the dependency order, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one table is in the dependency order, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither table is in the dependency order, maintain original order
    return 0;
  });
  
  return sorted;
}

// Helper function to import data for a specific table
async function importTableData(tableName: string, data: any[], mode: string) {
  const result = {
    imported: 0,
    errors: 0,
    details: [] as any[]
  };

  // If mode is 'replace', clear existing data first
  if (mode === 'replace') {
    try {
      await clearTableData(tableName);
    } catch (error) {
      console.error(`Error clearing table ${tableName}:`, error);
    }
  }

  // Import each record
  for (const record of data) {
    try {
      await importRecord(tableName, record, mode);
      result.imported++;
    } catch (error) {
      result.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error importing record in table ${tableName}:`, errorMessage, record);
      result.details.push({
        record: record,
        error: errorMessage
      });
    }
  }

  return result;
}

// Helper function to clear table data
async function clearTableData(tableName: string) {
  switch (tableName) {
    case 'users':
      // Don't clear users table for safety
      break;
    case 'factories':
      await prisma.factory.deleteMany();
      break;
    case 'lines':
      await prisma.line.deleteMany();
      break;
    case 'styles':
      await prisma.style.deleteMany();
      break;
    case 'productionList':
      await prisma.productionList.deleteMany();
      break;
    case 'targets':
      await prisma.target.deleteMany();
      break;
    case 'dailyProductionReport':
      await prisma.dailyProductionReport.deleteMany();
      break;
    case 'productionEntries':
      await prisma.productionEntry.deleteMany();
      break;
    case 'expenseCategories':
      await prisma.expenseCategory.deleteMany();
      break;
    case 'expenses':
      await prisma.expense.deleteMany();
      break;
    case 'salaryEntries':
      await prisma.salaryEntry.deleteMany();
      break;
    case 'cashbookEntries':
      await prisma.cashbookEntry.deleteMany();
      break;
    case 'dailySalaries':
      await prisma.dailySalary.deleteMany();
      break;
    case 'monthlyExpense':
      await prisma.monthlyExpense.deleteMany();
      break;
    case 'monthlyAttendanceReport':
      await prisma.monthlyAttendanceReport.deleteMany();
      break;
    case 'overtimeRecords':
      await prisma.overtimeRecord.deleteMany();
      break;
    case 'userPermissions':
      await prisma.userPermission.deleteMany();
      break;
    case 'employees':
      await prisma.employee.deleteMany();
      break;
    case 'dailyAttendance':
      await prisma.dailyAttendance.deleteMany();
      break;
    case 'manpowerSummary':
      await prisma.manpowerSummary.deleteMany();
      break;
    case 'shipments':
      await prisma.shipment.deleteMany();
      break;
    default:
      throw new Error(`Unknown table: ${tableName}`);
  }
}

// Helper function to import a single record
async function importRecord(tableName: string, record: any, mode: string) {
  // Remove id and timestamps for new records
  const cleanRecord = { ...record };
  delete cleanRecord.id;
  delete cleanRecord.createdAt;
  delete cleanRecord.updatedAt;
  
  // Handle nested objects and foreign key relationships
  const processedRecord = await processRecordForImport(tableName, cleanRecord);

  switch (tableName) {
    case 'users':
      if (mode === 'merge') {
        await prisma.user.upsert({
          where: { email: processedRecord.email },
          update: processedRecord,
          create: processedRecord
        });
      } else {
        await prisma.user.create({ data: processedRecord });
      }
      break;
      
    case 'factories':
      await prisma.factory.create({ data: processedRecord });
      break;
      
    case 'lines':
      await prisma.line.create({ data: processedRecord });
      break;
      
    case 'styles':
      if (mode === 'merge') {
        await prisma.style.upsert({
          where: { styleNumber: processedRecord.styleNumber },
          update: processedRecord,
          create: processedRecord
        });
      } else {
        await prisma.style.create({ data: processedRecord });
      }
      break;
      
    case 'productionList':
      if (mode === 'merge') {
        await prisma.productionList.upsert({
          where: { styleNo: processedRecord.styleNo },
          update: processedRecord,
          create: processedRecord
        });
      } else {
        await prisma.productionList.create({ data: processedRecord });
      }
      break;
      
    case 'targets':
      await prisma.target.create({ data: processedRecord });
      break;
      
    case 'dailyProductionReport':
      await prisma.dailyProductionReport.create({ data: processedRecord });
      break;
      
    case 'productionEntries':
      await prisma.productionEntry.create({ data: processedRecord });
      break;
      
    case 'expenseCategories':
      if (mode === 'merge') {
        await prisma.expenseCategory.upsert({
          where: { name: record.name },
          update: processedRecord,
          create: processedRecord
        });
      } else {
        await prisma.expenseCategory.create({ data: processedRecord });
      }
      break;
      
    case 'expenses':
      await prisma.expense.create({ data: processedRecord });
      break;
      
    case 'salaryEntries':
      await prisma.salaryEntry.create({ data: processedRecord });
      break;
      
    case 'cashbookEntries':
      await prisma.cashbookEntry.create({ data: processedRecord });
      break;
      
    case 'dailySalaries':
      await prisma.dailySalary.create({ data: processedRecord });
      break;
      
    case 'monthlyExpense':
      if (mode === 'merge') {
        await prisma.monthlyExpense.upsert({
          where: {
            month_year_category: {
              month: record.month,
              year: record.year,
              category: record.category
            }
          },
          update: processedRecord,
          create: processedRecord
        });
      } else {
        await prisma.monthlyExpense.create({ data: processedRecord });
      }
      break;
      
    case 'monthlyAttendanceReport':
      await prisma.monthlyAttendanceReport.create({ data: processedRecord });
      break;
      
    case 'overtimeRecords':
      await prisma.overtimeRecord.create({ data: processedRecord });
      break;
      
    case 'userPermissions':
      await prisma.userPermission.create({ data: processedRecord });
      break;
      
    case 'employees':
      await prisma.employee.create({ data: processedRecord });
      break;
      
    case 'dailyAttendance':
      await prisma.dailyAttendance.create({ data: processedRecord });
      break;
      
    case 'manpowerSummary':
      await prisma.manpowerSummary.create({ data: processedRecord });
      break;
      
    case 'shipments':
      await prisma.shipment.create({ data: processedRecord });
      break;
      
    default:
      throw new Error(`Unknown table: ${tableName}`);
  }
}

// Helper function to process records for import, handling foreign keys and nested objects
async function processRecordForImport(tableName: string, record: any): Promise<any> {
  const processed = { ...record };
  
  // Remove nested objects that shouldn't be imported directly
  delete processed.factory;
  delete processed.category;
  delete processed.line;
  delete processed.user;
  delete processed.permission;
  delete processed.dailyReports;
  delete processed.targets;
  
  // Handle specific table transformations
  switch (tableName) {
    case 'users':
      // Add default password if missing
      if (!processed.password) {
        processed.password = 'defaultPassword123'; // You should hash this in production
      }
      break;
      
    case 'lines':
      // If factoryId is provided as a nested object, extract the ID
      if (record.factory && record.factory.id) {
        processed.factoryId = record.factory.id;
      }
      break;
      
    case 'expenses':
      // Handle category and line relationships
      if (record.category && record.category.id) {
        processed.categoryId = record.category.id;
      }
      if (record.line && record.line.id) {
        processed.lineId = record.line.id;
      }
      break;
      
    case 'userPermissions':
      // Handle user and permission relationships
      if (record.user && record.user.id) {
        processed.userId = record.user.id;
      }
      if (record.permission && record.permission.id) {
        processed.permissionId = record.permission.id;
      }
      break;
      
    case 'productionList':
      // Remove nested arrays that will be imported separately
      delete processed.dailyReports;
      delete processed.targets;
      
      // Handle JSON fields
      if (processed.quantities && typeof processed.quantities === 'string') {
        try {
          processed.quantities = JSON.parse(processed.quantities);
        } catch (error) {
          delete processed.quantities;
        }
      }
      break;
      
    case 'productionEntries':
      // Handle production list relationship
      if (record.productionList && record.productionList.id) {
        processed.productionListId = record.productionList.id;
      }
      break;
      
    case 'cashbookEntries':
      // Ensure date field is properly handled
      if (processed.date && typeof processed.date === 'string') {
        const cleanDate = processed.date.replace(/^"(.*)"$/, '$1');
        const date = new Date(cleanDate);
        if (!isNaN(date.getTime())) {
          processed.date = date;
        }
      }
      break;
      
    default:
      // For other tables, just clean up any nested objects
      break;
  }
  
  // Convert date strings to Date objects if needed
  const dateFields = ['date', 'createdAt', 'updatedAt', 'paymentDate', 'lastLogin', 'expires', 'plannedStart', 'plannedEnd'];
  for (const field of dateFields) {
    if (processed[field] && typeof processed[field] === 'string') {
      try {
        // Remove double quotes if present
        let cleanValue = processed[field].replace(/^"(.*)"$/, '$1');
        const date = new Date(cleanValue);
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          processed[field] = date;
        } else {
          delete processed[field];
        }
      } catch (error) {
        // If date parsing fails, remove the field
        delete processed[field];
      }
    }
  }
  
  // Convert numeric strings to numbers
  const numericFields = ['amount', 'quantity', 'target', 'actual', 'month', 'year', 'orderQty', 'totalQty', 'percentage'];
  for (const field of numericFields) {
    if (processed[field] && typeof processed[field] === 'string') {
      // Remove double quotes if present
      let cleanValue = processed[field].replace(/^"(.*)"$/, '$1');
      const num = parseFloat(cleanValue);
      if (!isNaN(num)) {
        processed[field] = num;
      }
    }
  }
  
  // Convert boolean strings to booleans
  const booleanFields = ['isActive', 'isCompleted', 'isPaid'];
  for (const field of booleanFields) {
    if (processed[field] !== undefined) {
      if (typeof processed[field] === 'string') {
        processed[field] = processed[field].toLowerCase() === 'true';
      }
    }
  }
  
  // Clean up any remaining double-quoted strings
  for (const key in processed) {
    if (typeof processed[key] === 'string') {
      processed[key] = processed[key].replace(/^"(.*)"$/, '$1');
    }
  }
  
  // Remove empty string values that might cause issues
  for (const key in processed) {
    if (processed[key] === '' || processed[key] === null) {
      delete processed[key];
    }
  }
  
  return processed;
}

// Helper function to parse CSV data
function parseCSV(csvContent: string): any {
  const lines = csvContent.split('\n');
  const result: any = {
    metadata: {
      exportDate: new Date().toISOString(),
      format: 'csv'
    },
    data: {}
  };

  let currentTable = '';
  let headers: string[] = [];
  let isDataSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# Table:')) {
      currentTable = trimmedLine.replace('# Table:', '').trim();
      result.data[currentTable] = [];
      isDataSection = false;
      headers = [];
    } else if (trimmedLine && !isDataSection) {
      headers = trimmedLine.split(',').map(h => h.trim());
      isDataSection = true;
    } else if (trimmedLine && isDataSection && currentTable) {
      const values = parseCSVLine(trimmedLine);
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        result.data[currentTable].push(record);
      }
    }
  }

  return result;
}

// Helper function to parse a single CSV line
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}
