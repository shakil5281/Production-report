import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/database/cleanup - Clean up database (remove old/duplicate data)
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

    const body = await request.json();
    const { 
      cleanupType = 'all',
      olderThanDays = 365,
      dryRun = false 
    } = body;

    const results = {
      success: true,
      cleaned: 0,
      errors: 0,
      details: {} as Record<string, any>
    };

    // Perform cleanup based on type
    switch (cleanupType) {
      case 'old_data':
        await cleanupOldData(results, olderThanDays, dryRun);
        break;
      case 'duplicates':
        await cleanupDuplicates(results, dryRun);
        break;
      case 'orphaned':
        await cleanupOrphanedRecords(results, dryRun);
        break;
      case 'all':
        await cleanupOldData(results, olderThanDays, dryRun);
        await cleanupDuplicates(results, dryRun);
        await cleanupOrphanedRecords(results, dryRun);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid cleanup type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: results.errors === 0,
      message: `Cleanup completed. ${results.cleaned} records processed, ${results.errors} errors.`,
      results
    });

  } catch (error) {
    console.error('Error during database cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup database' },
      { status: 500 }
    );
  }
}

// Helper function to cleanup old data
async function cleanupOldData(results: any, olderThanDays: number, dryRun: boolean) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    // Clean up old daily production reports (keep last 2 years)
    const oldProductionReports = await prisma.dailyProductionReport.findMany({
      where: {
        date: {
          lt: cutoffDate
        }
      }
    });

    if (!dryRun && oldProductionReports.length > 0) {
      await prisma.dailyProductionReport.deleteMany({
        where: {
          date: {
            lt: cutoffDate
          }
        }
      });
    }

    results.details.oldProductionReports = {
      found: oldProductionReports.length,
      deleted: dryRun ? 0 : oldProductionReports.length
    };
    results.cleaned += oldProductionReports.length;

    // Clean up old cashbook entries (keep last 2 years)
    const oldCashbookEntries = await prisma.cashbookEntry.findMany({
      where: {
        date: {
          lt: cutoffDate
        }
      }
    });

    if (!dryRun && oldCashbookEntries.length > 0) {
      await prisma.cashbookEntry.deleteMany({
        where: {
          date: {
            lt: cutoffDate
          }
        }
      });
    }

    results.details.oldCashbookEntries = {
      found: oldCashbookEntries.length,
      deleted: dryRun ? 0 : oldCashbookEntries.length
    };
    results.cleaned += oldCashbookEntries.length;

    // Clean up old daily salaries (keep last 2 years)
    const oldDailySalaries = await prisma.dailySalary.findMany({
      where: {
        date: {
          lt: cutoffDate
        }
      }
    });

    if (!dryRun && oldDailySalaries.length > 0) {
      await prisma.dailySalary.deleteMany({
        where: {
          date: {
            lt: cutoffDate
          }
        }
      });
    }

    results.details.oldDailySalaries = {
      found: oldDailySalaries.length,
      deleted: dryRun ? 0 : oldDailySalaries.length
    };
    results.cleaned += oldDailySalaries.length;

  } catch (error) {
    console.error('Error cleaning up old data:', error);
    results.errors++;
    results.details.oldDataError = error instanceof Error ? error.message : 'Unknown error';
  }
}

// Helper function to cleanup duplicate records
async function cleanupDuplicates(results: any, dryRun: boolean) {
  try {
    // Find and remove duplicate monthly expenses
    const duplicateMonthlyExpenses = await prisma.$queryRaw`
      SELECT month, year, category, COUNT(*) as count
      FROM monthly_expenses
      GROUP BY month, year, category
      HAVING COUNT(*) > 1
    ` as any[];

    let deletedDuplicates = 0;
    if (!dryRun && duplicateMonthlyExpenses.length > 0) {
      for (const duplicate of duplicateMonthlyExpenses) {
        const records = await prisma.monthlyExpense.findMany({
          where: {
            month: duplicate.month,
            year: duplicate.year,
            category: duplicate.category
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Keep the latest record, delete the rest
        if (records.length > 1) {
          const idsToDelete = records.slice(1).map(r => r.id);
          await prisma.monthlyExpense.deleteMany({
            where: {
              id: {
                in: idsToDelete
              }
            }
          });
          deletedDuplicates += idsToDelete.length;
        }
      }
    }

    results.details.duplicateMonthlyExpenses = {
      found: duplicateMonthlyExpenses.length,
      deleted: deletedDuplicates
    };
    results.cleaned += deletedDuplicates;

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    results.errors++;
    results.details.duplicatesError = error instanceof Error ? error.message : 'Unknown error';
  }
}

// Helper function to cleanup orphaned records
async function cleanupOrphanedRecords(results: any, dryRun: boolean) {
  try {
    // Clean up orphaned production entries (without valid line or style)
    // First, get all production entries
    const allProductionEntries = await prisma.productionEntry.findMany({
      include: {
        line: true,
        style: true
      }
    });

    // Filter for orphaned entries
    const orphanedProductionEntries = allProductionEntries.filter(entry => 
      !entry.line || !entry.style
    );

    if (!dryRun && orphanedProductionEntries.length > 0) {
      const orphanedIds = orphanedProductionEntries.map(entry => entry.id);
      await prisma.productionEntry.deleteMany({
        where: {
          id: {
            in: orphanedIds
          }
        }
      });
    }

    results.details.orphanedProductionEntries = {
      found: orphanedProductionEntries.length,
      deleted: dryRun ? 0 : orphanedProductionEntries.length
    };
    results.cleaned += orphanedProductionEntries.length;

    // Clean up orphaned expenses (without valid category)
    const allExpenses = await prisma.expense.findMany({
      include: {
        category: true
      }
    });

    const orphanedExpenses = allExpenses.filter(expense => !expense.category);

    if (!dryRun && orphanedExpenses.length > 0) {
      const orphanedIds = orphanedExpenses.map(expense => expense.id);
      await prisma.expense.deleteMany({
        where: {
          id: {
            in: orphanedIds
          }
        }
      });
    }

    results.details.orphanedExpenses = {
      found: orphanedExpenses.length,
      deleted: dryRun ? 0 : orphanedExpenses.length
    };
    results.cleaned += orphanedExpenses.length;

  } catch (error) {
    console.error('Error cleaning up orphaned records:', error);
    results.errors++;
    results.details.orphanedError = error instanceof Error ? error.message : 'Unknown error';
  }
}
