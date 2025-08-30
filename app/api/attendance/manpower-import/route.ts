import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dateParam = formData.get('date') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Handle date properly to avoid timezone issues
    const dateString = dateParam; // Use the date string directly

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });



    const processedRecords = [];
    const errors = [];
    const errorDetails = [];

    // Clear existing data for this date using raw SQL
    try {
      await prisma.$executeRaw`DELETE FROM manpower_summary WHERE date::date = ${dateString}::date`;
    } catch (error) {

    }

    // Define the sections and their groupings based on your requirements
    const sectionGroups = {
      'production': ['Cutting', 'Finishing', 'Quality'],
      'sewingHelper': [] as string[], // Will be filled with Line-XX(Helper)
      'specialWorkers': ['Inputman', 'Ironman'],
      'operatorLines': [] as string[], // Will be filled with Line-XX(Operator)
      'supportStaff': ['Loader', 'Cleaner'],
      'securityOthers': ['Security', 'Others'],
      'officeStaff': ['Office Staff'],
      'mechanicalStaff': ['Mechanical Staff'],
      'productionStaff': ['Production Staff']
    };

    // Parse the Excel data first
    const rawData = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      
      // Skip empty rows
      if (!row || row.length === 0 || (!row[0] && !row[1])) {
        continue;
      }

      const sectionRaw = String(row[0] || '').trim();
      const present = parseInt(String(row[1] || '0')) || 0;
      const absent = parseInt(String(row[2] || '0')) || 0;
      const leave = parseInt(String(row[3] || '0')) || 0;
      const others = parseInt(String(row[4] || '0')) || 0;
      const total = parseInt(String(row[5] || '0')) || 0;
      const remarks = String(row[6] || '').trim();

      // Skip completely empty rows
      if (!sectionRaw && present === 0 && absent === 0 && leave === 0 && others === 0 && total === 0) {
        continue;
      }

      rawData.push({
        sectionRaw,
        present,
        absent,
        leave,
        others,
        total,
        remarks,
        row: i + 1
      });
    }

    // Now process and categorize the data
    const manpowerData = [];
    
    for (const data of rawData) {
      const { sectionRaw, present, absent, leave, others, total, remarks, row } = data;
      
      let section = '';
      let subsection = null;
      let lineNumber = null;
      let itemType = 'SECTION';

      // Categorize based on your specific structure
      if (sectionRaw.includes('Line-') && sectionRaw.includes('(')) {
        // Handle lines like "Line-01(Helper)" or "Line-01(Operator)"
        const match = sectionRaw.match(/^(Line-\d+)\((.*?)\)$/);
        if (match) {
          lineNumber = match[1];
          subsection = match[2].trim();
          
          if (subsection.toLowerCase().includes('helper')) {
            section = 'Sewing Helper';
            sectionGroups.sewingHelper.push(sectionRaw);
          } else if (subsection.toLowerCase().includes('operator')) {
            section = 'Operator Lines';
            sectionGroups.operatorLines.push(sectionRaw);
          } else {
            section = 'Other Lines';
          }
          itemType = 'LINE';
        }
      } else if (['Cutting', 'Finishing', 'Quality'].includes(sectionRaw)) {
        section = sectionRaw;
        itemType = 'SECTION';
      } else if (['Inputman', 'Ironman'].includes(sectionRaw)) {
        section = sectionRaw;
        itemType = 'SECTION';
      } else if (sectionRaw.includes('Loder') || sectionRaw.includes('Loader') || sectionRaw.includes('Cleaner')) {
        // Handle variations in spelling (Loder/Loader)
        section = sectionRaw;
        itemType = 'SECTION';
      } else if (['Security', 'Others'].includes(sectionRaw)) {
        section = sectionRaw;
        itemType = 'SECTION';
      } else if (sectionRaw.includes('Office') && sectionRaw.includes('Staff')) {
        section = 'Office Staff';
        itemType = 'SECTION';
      } else if (sectionRaw.includes('Macanical') || sectionRaw.includes('Mechanical')) {
        // Handle spelling variations (Macanical/Mechanical)
        section = sectionRaw.includes('Macanical') ? 'Macanical - Staff' : 'Mechanical Staff';
        itemType = 'SECTION';
      } else if (sectionRaw.includes('Production') && sectionRaw.includes('Staff')) {
        section = 'Production Staff';
        itemType = 'SECTION';
      } else if (sectionRaw.toLowerCase().includes('total')) {
        // Skip totals from Excel - we'll calculate our own
        continue;
      } else {
        // Default section
        section = sectionRaw;
        itemType = 'SECTION';
      }

      // Validate total calculation (more lenient)
      const calculatedTotal = present + absent + leave + others;
      const totalToUse = total > 0 ? total : calculatedTotal; // Use provided total or calculated
      
      if (total > 0 && Math.abs(calculatedTotal - total) > 2) {
        errorDetails.push(`Row ${row}: Total mismatch - calculated: ${calculatedTotal}, provided: ${total}, using provided`);
        // Don't add to errors array - just warn but continue
      }

      const manpowerEntry = {
        id: `manpower_${Date.now()}_${row}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section,
        subsection,
        lineNumber,
        itemType,
        present,
        absent,
        leave,
        others,
        total: totalToUse, // Use provided total or calculated
        remarks,
        parentId: null
      };

      manpowerData.push(manpowerEntry);
      processedRecords.push(manpowerEntry);
    }

    // Now calculate the hierarchical totals based on your requirements
    const calculatedTotals = [];

    // 1. Production Total (Cutting + Finishing + Quality)
    const productionSections = manpowerData.filter(m => 
      sectionGroups.production.includes(m.section) && m.itemType === 'SECTION'
    );
    if (productionSections.length > 0) {
      const productionTotal = {
        id: `total_production_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Production Total',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: productionSections.reduce((sum, s) => sum + s.present, 0),
        absent: productionSections.reduce((sum, s) => sum + s.absent, 0),
        leave: productionSections.reduce((sum, s) => sum + s.leave, 0),
        others: productionSections.reduce((sum, s) => sum + s.others, 0),
        total: productionSections.reduce((sum, s) => sum + s.total, 0),
        remarks: 'Auto-calculated: Cutting + Finishing + Quality',
        parentId: null
      };
      calculatedTotals.push(productionTotal);
    }

    // 2. Sewing Helper Total (all Line-XX(Helper))
    const sewingHelperLines = manpowerData.filter(m => 
      m.section === 'Sewing Helper' && m.itemType === 'LINE'
    );
    if (sewingHelperLines.length > 0) {
      const sewingHelperTotal = {
        id: `total_sewing_helper_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Sewing Helper Total',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: sewingHelperLines.reduce((sum, s) => sum + s.present, 0),
        absent: sewingHelperLines.reduce((sum, s) => sum + s.absent, 0),
        leave: sewingHelperLines.reduce((sum, s) => sum + s.leave, 0),
        others: sewingHelperLines.reduce((sum, s) => sum + s.others, 0),
        total: sewingHelperLines.reduce((sum, s) => sum + s.total, 0),
        remarks: 'Auto-calculated: All Sewing Helper Lines',
        parentId: null
      };
      calculatedTotals.push(sewingHelperTotal);
    }

    // 3. Special Workers Total (Inputman + Ironman)
    const specialWorkers = manpowerData.filter(m => 
      sectionGroups.specialWorkers.includes(m.section) && m.itemType === 'SECTION'
    );
    if (specialWorkers.length > 0) {
      const specialWorkersTotal = {
        id: `total_special_workers_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Special Workers Total',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: specialWorkers.reduce((sum, s) => sum + s.present, 0),
        absent: specialWorkers.reduce((sum, s) => sum + s.absent, 0),
        leave: specialWorkers.reduce((sum, s) => sum + s.leave, 0),
        others: specialWorkers.reduce((sum, s) => sum + s.others, 0),
        total: specialWorkers.reduce((sum, s) => sum + s.total, 0),
        remarks: 'Auto-calculated: Inputman + Ironman',
        parentId: null
      };
      calculatedTotals.push(specialWorkersTotal);
    }

    // 4. Operator Lines Total (all Line-XX(Operator))
    const operatorLines = manpowerData.filter(m => 
      m.section === 'Operator Lines' && m.itemType === 'LINE'
    );
    if (operatorLines.length > 0) {
      const operatorTotal = {
        id: `total_operator_lines_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Operator Lines Total',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: operatorLines.reduce((sum, s) => sum + s.present, 0),
        absent: operatorLines.reduce((sum, s) => sum + s.absent, 0),
        leave: operatorLines.reduce((sum, s) => sum + s.leave, 0),
        others: operatorLines.reduce((sum, s) => sum + s.others, 0),
        total: operatorLines.reduce((sum, s) => sum + s.total, 0),
        remarks: 'Auto-calculated: All Operator Lines',
        parentId: null
      };
      calculatedTotals.push(operatorTotal);
    }

    // 5. Support Staff Total (Loder/Loader + Cleaner)
    const supportStaff = manpowerData.filter(m => 
      (m.section.includes('Loder') || m.section.includes('Loader') || m.section.includes('Cleaner')) && m.itemType === 'SECTION'
    );
    if (supportStaff.length > 0) {
      const supportTotal = {
        id: `total_support_staff_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Support Staff Total',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: supportStaff.reduce((sum, s) => sum + s.present, 0),
        absent: supportStaff.reduce((sum, s) => sum + s.absent, 0),
        leave: supportStaff.reduce((sum, s) => sum + s.leave, 0),
        others: supportStaff.reduce((sum, s) => sum + s.others, 0),
        total: supportStaff.reduce((sum, s) => sum + s.total, 0),
        remarks: 'Auto-calculated: Loader + Cleaner',
        parentId: null
      };
      calculatedTotals.push(supportTotal);
    }

    // 6. Security & Others Total (Security + Others)
    const securityOthers = manpowerData.filter(m => 
      sectionGroups.securityOthers.includes(m.section) && m.itemType === 'SECTION'
    );
    if (securityOthers.length > 0) {
      const securityOthersTotal = {
        id: `total_security_others_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Security & Others Total',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: securityOthers.reduce((sum, s) => sum + s.present, 0),
        absent: securityOthers.reduce((sum, s) => sum + s.absent, 0),
        leave: securityOthers.reduce((sum, s) => sum + s.leave, 0),
        others: securityOthers.reduce((sum, s) => sum + s.others, 0),
        total: securityOthers.reduce((sum, s) => sum + s.total, 0),
        remarks: 'Auto-calculated: Security + Others',
        parentId: null
      };
      calculatedTotals.push(securityOthersTotal);
    }

    // 7. Total Worker (sum of all production totals)
    const workerTotals = calculatedTotals.filter(t => 
      ['Production Total', 'Sewing Helper Total', 'Special Workers Total', 'Operator Lines Total', 'Support Staff Total', 'Security & Others Total'].includes(t.section)
    );
    if (workerTotals.length > 0) {
      const totalWorker = {
        id: `total_worker_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Total Worker',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: workerTotals.reduce((sum, s) => sum + s.present, 0),
        absent: workerTotals.reduce((sum, s) => sum + s.absent, 0),
        leave: workerTotals.reduce((sum, s) => sum + s.leave, 0),
        others: workerTotals.reduce((sum, s) => sum + s.others, 0),
        total: workerTotals.reduce((sum, s) => sum + s.total, 0),
        remarks: 'Auto-calculated: Sum of all worker totals',
        parentId: null
      };
      calculatedTotals.push(totalWorker);
    }

    // 8. Total Staff (Office Staff + Mechanical/Macanical Staff + Production Staff)
    const staffSections = manpowerData.filter(m => 
      (m.section === 'Office Staff' || 
       m.section.includes('Mechanical') || 
       m.section.includes('Macanical') || 
       m.section === 'Production Staff') && m.itemType === 'SECTION'
    );
    if (staffSections.length > 0) {
      const totalStaff = {
        id: `total_staff_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Total Staff',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: staffSections.reduce((sum, s) => sum + s.present, 0),
        absent: staffSections.reduce((sum, s) => sum + s.absent, 0),
        leave: staffSections.reduce((sum, s) => sum + s.leave, 0),
        others: staffSections.reduce((sum, s) => sum + s.others, 0),
        total: staffSections.reduce((sum, s) => sum + s.total, 0),
        remarks: 'Auto-calculated: Office + Mechanical + Production Staff',
        parentId: null
      };
      calculatedTotals.push(totalStaff);
    }

    // 9. Grand Total (Total Worker + Total Staff)
    const totalWorkerEntry = calculatedTotals.find(t => t.section === 'Total Worker');
    const totalStaffEntry = calculatedTotals.find(t => t.section === 'Total Staff');
    
    if (totalWorkerEntry || totalStaffEntry) {
      const grandTotal = {
        id: `grand_total_${Date.now()}`,
        date: new Date(dateString + 'T12:00:00.000Z'),
        section: 'Grand Total',
        subsection: null,
        lineNumber: null,
        itemType: 'TOTAL',
        present: (totalWorkerEntry?.present || 0) + (totalStaffEntry?.present || 0),
        absent: (totalWorkerEntry?.absent || 0) + (totalStaffEntry?.absent || 0),
        leave: (totalWorkerEntry?.leave || 0) + (totalStaffEntry?.leave || 0),
        others: (totalWorkerEntry?.others || 0) + (totalStaffEntry?.others || 0),
        total: (totalWorkerEntry?.total || 0) + (totalStaffEntry?.total || 0),
        remarks: 'Auto-calculated: Total Worker + Total Staff',
        parentId: null
      };
      calculatedTotals.push(grandTotal);
    }

    // Combine all data for insertion
    const allRecords = [...manpowerData, ...calculatedTotals];

    // Insert all records into database with better error handling
    let insertSuccessCount = 0;
    for (const record of allRecords) {
      try {
        // Validate record before insertion
        if (!record.section || record.section.trim() === '') {
          errorDetails.push(`Skipping record with empty section: ${record.id}`);
          continue;
        }

        await prisma.$queryRaw`
          INSERT INTO manpower_summary (
            id, date, section, subsection, "lineNumber", "itemType",
            present, absent, leave, others, total, remarks, "parentId", "createdAt", "updatedAt"
          ) VALUES (
            ${record.id}, ${record.date}, ${record.section}, ${record.subsection},
            ${record.lineNumber}, ${record.itemType}::"ManpowerItemType", ${record.present}, ${record.absent},
            ${record.leave}, ${record.others}, ${record.total}, ${record.remarks}, ${record.parentId}, NOW(), NOW()
          )
        `;
        insertSuccessCount++;
      } catch (error) {

        errors.push(`Failed to insert: ${record.section}`);
        errorDetails.push(`DB Error for ${record.section}: ${error}`);
      }
    }



    // Get summary for response
    const sectionSummary = await prisma.$queryRaw`
      SELECT 
        section,
        SUM(present) as total_present,
        SUM(absent) as total_absent,
        SUM(leave) as total_leave,
        SUM(others) as total_others,
        SUM(total) as grand_total
      FROM manpower_summary 
      WHERE date::date = ${dateString}::date 
        AND "itemType" = 'TOTAL'
        AND section != 'Grand Total'
      GROUP BY section
    ` as any[];

    return NextResponse.json({
      success: insertSuccessCount > 0, // Success if at least some records were inserted
      data: {
        processedRecords: allRecords.length,
        insertedRecords: insertSuccessCount,
        originalData: manpowerData.length,
        calculatedTotals: calculatedTotals.length,
        sections: [...new Set(manpowerData.map(m => m.section))],
        errors: errors.length,
        errorDetails: errorDetails.slice(0, 15), // Show more error details
        date: dateString,
        summary: sectionSummary.map(s => ({
          section: s.section,
          present: Number(s.total_present),
          absent: Number(s.total_absent),
          leave: Number(s.total_leave),
          others: Number(s.total_others),
          total: Number(s.grand_total)
        }))
      },
      message: `Manpower import completed. ${insertSuccessCount}/${allRecords.length} records inserted successfully (${manpowerData.length} original + ${calculatedTotals.length} calculated totals). ${errors.length} errors occurred.`
    });

  } catch (error) {

    return NextResponse.json(
      { success: false, error: `Import failed: ${error}` },
      { status: 500 }
    );
  }
}