import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET current salary rates
export async function GET(request: NextRequest) {
  try {
    // Get the most recent active rates for each section and rate type
    const salaryRates = await prisma.$queryRaw`
      SELECT DISTINCT ON (section, "rateType") 
        id, section, "rateType", amount, "isActive", "effectiveDate",
        "createdAt", "updatedAt"
      FROM salary_rates 
      WHERE "isActive" = true
      ORDER BY section ASC, "rateType" ASC, "effectiveDate" DESC
    ` as any[];

    // Group rates by section
    const ratesBySection: Record<string, any> = {};
    
    salaryRates.forEach((rate: any) => {
      if (!ratesBySection[rate.section]) {
        ratesBySection[rate.section] = {
          section: rate.section,
          regular: null,
          overtime: null
        };
      }
      
      if (rate.rateType === 'REGULAR') {
        ratesBySection[rate.section].regular = {
          id: rate.id,
          amount: Number(rate.amount),
          effectiveDate: rate.effectiveDate,
          updatedAt: rate.updatedAt
        };
      } else if (rate.rateType === 'OVERTIME') {
        ratesBySection[rate.section].overtime = {
          id: rate.id,
          amount: Number(rate.amount),
          effectiveDate: rate.effectiveDate,
          updatedAt: rate.updatedAt
        };
      }
    });

    // Default sections with default rates
    const defaultSections = [
      'Staff', 'Operator', 'Helper', 'Cutting', 'Finishing', 'Quality', 'Security'
    ];

    defaultSections.forEach(section => {
      if (!ratesBySection[section]) {
        ratesBySection[section] = {
          section,
          regular: { amount: 0, effectiveDate: new Date(), updatedAt: new Date() },
          overtime: { amount: 0, effectiveDate: new Date(), updatedAt: new Date() }
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        rates: Object.values(ratesBySection),
        totalSections: Object.keys(ratesBySection).length
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

// POST update salary rates
export async function POST(request: NextRequest) {
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

    for (const rateData of rates) {
      try {
        const { section, regular, overtime } = rateData;
        
        if (!section) {
          errors.push(`Section is required for rate data`);
          continue;
        }

        // Update regular rate
        if (regular !== undefined && regular !== null && regular !== '' && !isNaN(Number(regular))) {
          const regularRateId = `rate_regular_${section}_${Date.now()}`;
          const regularAmount = Number(regular);
          
          await prisma.$queryRaw`
            INSERT INTO salary_rates (
              id, section, "rateType", amount, "isActive", "effectiveDate", "createdAt", "updatedAt"
            ) VALUES (
              ${regularRateId}, ${section}, 'REGULAR'::"SalaryRateType", 
              ${regularAmount}, true, NOW(), NOW(), NOW()
            )
            ON CONFLICT (section, "rateType", "effectiveDate") 
            DO UPDATE SET 
              amount = ${regularAmount},
              "isActive" = true,
              "updatedAt" = NOW()
          `;
        }

        // Update overtime rate
        if (overtime !== undefined && overtime !== null && overtime !== '' && !isNaN(Number(overtime))) {
          const overtimeRateId = `rate_overtime_${section}_${Date.now()}`;
          const overtimeAmount = Number(overtime);
          
          await prisma.$queryRaw`
            INSERT INTO salary_rates (
              id, section, "rateType", amount, "isActive", "effectiveDate", "createdAt", "updatedAt"
            ) VALUES (
              ${overtimeRateId}, ${section}, 'OVERTIME'::"SalaryRateType", 
              ${overtimeAmount}, true, NOW(), NOW(), NOW()
            )
            ON CONFLICT (section, "rateType", "effectiveDate") 
            DO UPDATE SET 
              amount = ${overtimeAmount},
              "isActive" = true,
              "updatedAt" = NOW()
          `;
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
