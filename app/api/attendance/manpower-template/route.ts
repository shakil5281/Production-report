import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// GET download manpower template based on the hierarchical structure
export async function GET(request: NextRequest) {
  try {
    // Create template data with NEW calculation structure (no manual totals - they'll be auto-calculated)
    const templateData = [
      ['Section', 'Present', 'Absent', 'Leave', 'Others', 'Total', 'Remarks'],
      ['', '', '', '', '', '', ''], // Empty instruction row
      ['PRODUCTION SECTIONS (will create "Production Total")', '', '', '', '', '', ''],
      ['Cutting', 22, 6, 0, 0, 28, 'Enter your data'],
      ['Finishing', 48, 2, 0, 0, 50, 'Enter your data'],
      ['Quality', 31, 3, 1, 0, 35, 'Enter your data'],
      ['', '', '', '', '', '', ''], // Empty row for separation
      ['SEWING HELPER LINES (will create "Sewing Helper Total")', '', '', '', '', '', ''],
      ['Line-01(Helper)', 12, 1, 0, 0, 13, 'Helper lines'],
      ['Line-02(Helper)', 13, 1, 0, 0, 14, 'Helper lines'],
      ['Line-03(Helper)', 14, 0, 0, 0, 14, 'Helper lines'],
      ['Line-04(Helper)', 14, 0, 0, 0, 14, 'Helper lines'],
      ['Line-05(Helper)', 12, 1, 0, 0, 13, 'Helper lines'],
      ['Line-06(Helper)', 17, 2, 0, 0, 19, 'Helper lines'],
      ['', '', '', '', '', '', ''], // Empty row for separation
      ['SPECIAL WORKERS (will create "Special Workers Total")', '', '', '', '', '', ''],
      ['Inputman', 5, 0, 0, 0, 5, 'Special worker'],
      ['Ironman', 3, 1, 0, 0, 4, 'Special worker'],
      ['', '', '', '', '', '', ''], // Empty row for separation
      ['OPERATOR LINES (will create "Operator Lines Total")', '', '', '', '', '', ''],
      ['Line-01(Operator)', 34, 4, 0, 0, 38, 'Operator lines'],
      ['Line-02(Operator)', 35, 3, 0, 0, 38, 'Operator lines'],
      ['Line-03(Operator)', 35, 2, 0, 0, 37, 'Operator lines'],
      ['Line-04(Operator)', 35, 2, 0, 0, 37, 'Operator lines'],
      ['Line-05(Operator)', 31, 5, 0, 0, 36, 'Operator lines'],
      ['Line-06(Operator)', 32, 6, 0, 0, 38, 'Operator lines'],
      ['', '', '', '', '', '', ''], // Empty row for separation
      ['SUPPORT STAFF (will create "Support Staff Total")', '', '', '', '', '', ''],
      ['Loader', 8, 0, 0, 0, 8, 'Support staff'],
      ['Cleaner', 7, 0, 0, 0, 7, 'Support staff'],
      ['', '', '', '', '', '', ''], // Empty row for separation
      ['STAFF SECTIONS (will create "Total Staff")', '', '', '', '', '', ''],
      ['Office Staff', 9, 0, 0, 0, 9, 'Staff member'],
      ['Mechanical Staff', 3, 0, 1, 0, 4, 'Staff member'],
      ['Production Staff', 31, 1, 0, 0, 32, 'Staff member'],
      ['', '', '', '', '', '', ''], // Empty row for separation
      ['AUTO-CALCULATED TOTALS:', '', '', '', '', '', ''],
      ['✓ Production Total', '', '', '', '', '', 'Auto-calculated'],
      ['✓ Sewing Helper Total', '', '', '', '', '', 'Auto-calculated'],
      ['✓ Special Workers Total', '', '', '', '', '', 'Auto-calculated'],
      ['✓ Operator Lines Total', '', '', '', '', '', 'Auto-calculated'],
      ['✓ Support Staff Total', '', '', '', '', '', 'Auto-calculated'],
      ['✓ Total Worker', '', '', '', '', '', 'Auto-calculated'],
      ['✓ Total Staff', '', '', '', '', '', 'Auto-calculated'],
      ['✓ Grand Total', '', '', '', '', '', 'Auto-calculated']
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 20 }, // Section
      { width: 10 }, // Present
      { width: 10 }, // Absent
      { width: 10 }, // Leave
      { width: 10 }, // Others
      { width: 10 }, // Total
      { width: 15 }  // Remarks
    ];

    // Style definitions
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const sectionStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E7E6E6" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const totalStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "ADD8E6" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const lineStyle = {
      font: { italic: true },
      alignment: { horizontal: "left", vertical: "center" }
    };

    // Apply header styling (row 1)
    for (let col = 0; col < 7; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellRef]) worksheet[cellRef] = { t: 's', v: '' };
      worksheet[cellRef].s = headerStyle;
    }

    // Apply styling to specific rows based on content
    for (let row = 1; row < templateData.length; row++) {
      const rowData = templateData[row];
      const sectionText = String(rowData[0] || '');
      
      if (sectionText.includes('Total')) {
        // Total rows
        for (let col = 0; col < 7; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = totalStyle;
          }
        }
      } else if (sectionText.includes('Line-')) {
        // Line rows
        for (let col = 0; col < 7; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = lineStyle;
          }
        }
      } else if (sectionText && !sectionText.includes('(')) {
        // Main section rows
        for (let col = 0; col < 7; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = sectionStyle;
          }
        }
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Manpower Summary');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer',
      bookSST: false
    });

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="manpower_summary_template.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}