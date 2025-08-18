import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let whereClause: any = {};
    
    if (section) {
      whereClause.section = section;
    }
    
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    // Get all salary rates with optional filtering
    const salaryRates = await prisma.salaryRate.findMany({
      where: whereClause,
      orderBy: [
        { section: 'asc' },
        { rateType: 'asc' },
        { effectiveDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Get distinct sections
    const sections = await prisma.salaryRate.findMany({
      select: {
        section: true,
      },
      distinct: ['section'],
      orderBy: {
        section: 'asc'
      }
    });

    // Group rates by section for easier management
    const ratesBySection: Record<string, any> = {};
    
    // Get the latest active rate for each section and rate type
    for (const sectionData of sections) {
      const sectionName = sectionData.section;
      
      const regularRate = await prisma.salaryRate.findFirst({
        where: {
          section: sectionName,
          rateType: 'REGULAR',
          isActive: true
        },
        orderBy: [
          { effectiveDate: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      const overtimeRate = await prisma.salaryRate.findFirst({
        where: {
          section: sectionName,
          rateType: 'OVERTIME',
          isActive: true
        },
        orderBy: [
          { effectiveDate: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      ratesBySection[sectionName] = {
        section: sectionName,
        regular: regularRate ? {
          id: regularRate.id,
          amount: Number(regularRate.amount),
          effectiveDate: regularRate.effectiveDate,
          createdAt: regularRate.createdAt,
          updatedAt: regularRate.updatedAt
        } : null,
        overtime: overtimeRate ? {
          id: overtimeRate.id,
          amount: Number(overtimeRate.amount),
          effectiveDate: overtimeRate.effectiveDate,
          createdAt: overtimeRate.createdAt,
          updatedAt: overtimeRate.updatedAt
        } : null
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        rates: Object.values(ratesBySection),
        allRates: salaryRates.map(rate => ({
          ...rate,
          amount: Number(rate.amount)
        })),
        sections: sections.map(s => s.section),
        totalSections: sections.length,
        totalRates: salaryRates.length
      }
    });

  } catch (error) {
    console.error('Error fetching salary rates:', error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch salary rates: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, rateType, amount, effectiveDate } = body;

    // Validation
    if (!section || !rateType || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, error: 'Section, rateType, and amount are required' },
        { status: 400 }
      );
    }

    if (!['REGULAR', 'OVERTIME'].includes(rateType)) {
      return NextResponse.json(
        { success: false, error: 'Rate type must be REGULAR or OVERTIME' },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a valid positive number' },
        { status: 400 }
      );
    }

    const effective = effectiveDate ? new Date(effectiveDate) : new Date();

    // Create new salary rate
    const newRate = await prisma.salaryRate.create({
      data: {
        section,
        rateType: rateType as 'REGULAR' | 'OVERTIME',
        amount: numericAmount,
        effectiveDate: effective,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newRate,
        amount: Number(newRate.amount)
      },
      message: `${rateType.toLowerCase()} rate for ${section} created successfully`
    });

  } catch (error) {
    console.error('Error creating salary rate:', error);
    return NextResponse.json(
      { success: false, error: `Failed to create salary rate: ${error}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rates } = body;

    if (!rates || !Array.isArray(rates)) {
      return NextResponse.json(
        { success: false, error: 'Rates array is required' },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const errors = [];
    const updatedRates = [];

    for (const rateData of rates) {
      try {
        const { section, regular, overtime } = rateData;
        
        if (!section) {
          errors.push(`Section is required for rate data`);
          continue;
        }

        const currentDate = new Date();

        // Update regular rate
        if (regular !== undefined && regular !== null && regular !== '' && !isNaN(Number(regular))) {
          const regularAmount = Number(regular);
          
          // Deactivate old regular rates for this section
          await prisma.salaryRate.updateMany({
            where: {
              section,
              rateType: 'REGULAR',
              isActive: true
            },
            data: {
              isActive: false,
              updatedAt: currentDate
            }
          });

          // Create new regular rate
          const newRegularRate = await prisma.salaryRate.create({
            data: {
              section,
              rateType: 'REGULAR',
              amount: regularAmount,
              effectiveDate: currentDate,
              isActive: true
            }
          });

          updatedRates.push({
            section,
            type: 'REGULAR',
            amount: regularAmount,
            id: newRegularRate.id
          });
        }

        // Update overtime rate
        if (overtime !== undefined && overtime !== null && overtime !== '' && !isNaN(Number(overtime))) {
          const overtimeAmount = Number(overtime);
          
          // Deactivate old overtime rates for this section
          await prisma.salaryRate.updateMany({
            where: {
              section,
              rateType: 'OVERTIME',
              isActive: true
            },
            data: {
              isActive: false,
              updatedAt: currentDate
            }
          });

          // Create new overtime rate
          const newOvertimeRate = await prisma.salaryRate.create({
            data: {
              section,
              rateType: 'OVERTIME',
              amount: overtimeAmount,
              effectiveDate: currentDate,
              isActive: true
            }
          });

          updatedRates.push({
            section,
            type: 'OVERTIME',
            amount: overtimeAmount,
            id: newOvertimeRate.id
          });
        }

        updatedCount++;
      } catch (error) {
        console.error('Error updating salary rate:', error);
        errors.push(`Failed to update ${rateData.section}: ${error}`);
      }
    }

    return NextResponse.json({
      success: updatedCount > 0,
      data: {
        updatedSections: updatedCount,
        totalSections: rates.length,
        updatedRates,
        errors: errors.length,
        errorDetails: errors.slice(0, 10)
      },
      message: `Salary rates updated. ${updatedCount}/${rates.length} sections updated successfully.`
    });

  } catch (error) {
    console.error('Error updating salary rates:', error);
    return NextResponse.json(
      { success: false, error: `Failed to update salary rates: ${error}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rateId = searchParams.get('id');
    const section = searchParams.get('section');
    const rateType = searchParams.get('rateType');

    if (rateId) {
      // Delete specific rate by ID
      const deletedRate = await prisma.salaryRate.update({
        where: { id: rateId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        data: deletedRate,
        message: 'Salary rate deactivated successfully'
      });
    } else if (section && rateType) {
      // Deactivate all rates for a specific section and rate type
      const result = await prisma.salaryRate.updateMany({
        where: {
          section,
          rateType: rateType as 'REGULAR' | 'OVERTIME',
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        data: { updatedCount: result.count },
        message: `${result.count} ${rateType.toLowerCase()} rates for ${section} deactivated successfully`
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Either rate ID or section+rateType is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error deleting salary rate:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete salary rate: ${error}` },
      { status: 500 }
    );
  }
}
