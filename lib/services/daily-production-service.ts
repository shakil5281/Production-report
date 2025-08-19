import { prisma } from '@/lib/db/prisma';

export interface TargetProductionData {
  targetId: string;
  styleNo: string;
  lineNo: string;
  dateString: string; // Changed from Date to string to avoid double timezone conversion
  hourlyProduction: number;
  lineTarget: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
}

export class DailyProductionService {
  
  /**
   * Handle target-based production tracking
   * Called when targets are created, updated, or deleted
   */
  static async handleTargetProduction(data: TargetProductionData) {
    const { targetId, styleNo, lineNo, dateString, hourlyProduction, lineTarget, action } = data;
    
    try {
      console.log(`🔄 Processing ${action} for target ${targetId}: Style ${styleNo}, Line ${lineNo}, Hourly ${hourlyProduction}`);
      
      // Use the date string directly to avoid double timezone conversion
      console.log(`📅 Using date string: ${dateString}`);
      const [year, month, day] = dateString.split('-').map(Number);
      const reportDate = new Date(year, month - 1, day, 0, 0, 0, 0);

      // Get production item details
      const productionItem = await prisma.productionList.findUnique({
        where: { styleNo }
      });

      if (!productionItem) {
        throw new Error(`Production item with styleNo ${styleNo} not found`);
      }

      // Find existing daily production report using date range to handle different time formats
      // IMPORTANT: Search by BOTH styleNo AND lineNo to keep lines separate
      const nextDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      const existingReport = await prisma.dailyProductionReport.findFirst({
        where: {
          styleNo: styleNo,
          lineNo: lineNo, // 🔧 FIX: Include lineNo to keep lines separate
          date: {
            gte: reportDate,
            lte: nextDay
          }
        }
      });

      console.log(`📊 Existing report for ${styleNo} on ${dateString}: ${existingReport ? 'Found' : 'Not found'}`);
      if (existingReport) {
        console.log(`   Current: Production=${existingReport.productionQty}, Target=${existingReport.targetQty}`);
      }

      let newProductionQty: number;
      let newTargetQty: number;

      // Handle different actions with clear logic
      switch (action) {
        case 'CREATE':
          console.log(`   ➕ CREATE: Adding hourly production ${hourlyProduction}`);
          if (existingReport) {
            // Add to existing production
            newProductionQty = existingReport.productionQty + hourlyProduction;
            newTargetQty = Math.max(existingReport.targetQty, lineTarget);
          } else {
            // Create new report
            newProductionQty = hourlyProduction;
            newTargetQty = lineTarget;
          }
          break;

        case 'UPDATE':
          console.log(`   🔄 UPDATE: Need to calculate difference for updated target`);
          // For updates, we need to handle the change in hourly production
          // This is complex because the target is already updated by the time we get here
          // We'll use a simpler approach: get all targets for this SPECIFIC style+line+date and sum their hourly production
          const allTargets = await prisma.target.findMany({
            where: { 
              styleNo,
              lineNo, // 🔧 IMPORTANT: Keep same line separate from other lines
              date: {
                gte: reportDate,
                lte: nextDay
              }
            }
          });
          
          const totalHourlyProduction = allTargets.reduce((sum, target) => sum + target.hourlyProduction, 0);
          const maxLineTarget = allTargets.length > 0 ? Math.max(...allTargets.map(target => target.lineTarget)) : lineTarget;
          
          console.log(`   📊 Found ${allTargets.length} targets for Line ${lineNo}, total hourly: ${totalHourlyProduction}, max target: ${maxLineTarget}`);
          
          newProductionQty = totalHourlyProduction;
          newTargetQty = maxLineTarget;
          break;

        case 'DELETE':
          console.log(`   🗑️ DELETE: Removing hourly production ${hourlyProduction}`);
          if (existingReport) {
            newProductionQty = Math.max(0, existingReport.productionQty - hourlyProduction);
            newTargetQty = existingReport.targetQty;
          } else {
            console.log(`   ⏭️ No existing report to delete from, skipping`);
            return null;
          }
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      console.log(`   📈 New values: Production=${newProductionQty}, Target=${newTargetQty}`);

      // 🗑️ AUTO-DELETE: If production quantity becomes 0, delete the report
      if (newProductionQty <= 0 && existingReport) {
        console.log(`   🗑️ AUTO-DELETE: Production quantity is 0, deleting report`);
        await prisma.dailyProductionReport.delete({
          where: { id: existingReport.id }
        });
        console.log(`   ✅ Deleted report for Production Qty = 0`);
        return null; // Return null to indicate deletion
      }

      // Skip creating new reports with 0 production
      if (newProductionQty <= 0 && !existingReport) {
        console.log(`   ⏭️ Skipping creation of report with 0 production quantity`);
        return null;
      }

      // Calculate derived values
      const unitPrice = productionItem.price;
      const totalAmount = newProductionQty * Number(unitPrice);
      const netAmount = totalAmount * (Number(productionItem.percentage || 0) / 100) * 120;

      const reportData = {
        date: reportDate,
        styleNo,
        targetQty: newTargetQty,
        productionQty: newProductionQty,
        unitPrice: unitPrice,
        totalAmount: totalAmount,
        netAmount: netAmount,
        lineNo: lineNo
      };

      let report;
      if (existingReport) {
        // Update existing report
        report = await prisma.dailyProductionReport.update({
          where: { id: existingReport.id },
          data: reportData
        });
        console.log(`   ✅ Updated existing report`);
      } else {
        // Create new report
        report = await prisma.dailyProductionReport.create({
          data: reportData
        });
        console.log(`   ✅ Created new report`);
      }

      return report;

    } catch (error) {
      console.error('Error handling target production tracking:', error);
      throw error;
    }
  }

  /**
   * Get daily production summary for a specific date
   */
  static async getDailyProductionSummary(date: Date) {
    // Use local dates to match target service behavior
    const dateStr = date.toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const reportDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const nextDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const reports = await prisma.dailyProductionReport.findMany({
      where: {
        date: {
          gte: reportDate,
          lte: nextDay
        }
      },
      include: {
        productionList: {
          select: {
            buyer: true,
            item: true,
            totalQty: true
          }
        }
      },
      orderBy: { styleNo: 'asc' }
    });

    const summary = {
      totalStyles: reports.length,
      totalTargetQty: reports.reduce((sum, r) => sum + (r.targetQty || 0), 0),
      totalProductionQty: reports.reduce((sum, r) => sum + (r.productionQty || 0), 0),
      totalAmount: reports.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0),
      totalNetAmount: reports.reduce((sum, r) => sum + Number(r.netAmount || 0), 0),
      overallEfficiency: reports.length > 0 
        ? reports.reduce((sum, r) => {
            const target = r.targetQty || 0;
            const production = r.productionQty || 0;
            return sum + (target > 0 ? (production / target * 100) : 0);
          }, 0) / reports.length 
        : 0
    };

    return { reports, summary };
  }

  /**
   * Get production trends for a date range
   */
  static async getProductionTrends(startDate: Date, endDate: Date) {
    const reports = await prisma.dailyProductionReport.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        productionList: {
          select: {
            buyer: true,
            item: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { styleNo: 'asc' }
      ]
    });

    // Group by date for trend analysis
    const trendData = reports.reduce((acc, report) => {
      const dateKey = report.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: report.date,
          totalTarget: 0,
          totalProduction: 0,
          totalAmount: 0,
          totalNetAmount: 0,
          styles: []
        };
      }
      
      acc[dateKey].totalTarget += report.targetQty;
      acc[dateKey].totalProduction += report.productionQty;
      acc[dateKey].totalAmount += Number(report.totalAmount);
      acc[dateKey].totalNetAmount += Number(report.netAmount || 0);
      acc[dateKey].styles.push({
        styleNo: report.styleNo,
        target: report.targetQty,
        production: report.productionQty,
        efficiency: (report.productionQty / report.targetQty * 100)
      });

      return acc;
    }, {} as Record<string, any>);

    return Object.values(trendData);
  }
}
