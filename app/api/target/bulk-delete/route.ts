import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import { DailyProductionService } from '@/lib/services/daily-production-service';

// POST bulk delete targets
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetIds } = body;

    // Validation
    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Target IDs array is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Bulk delete request for ${targetIds.length} targets:`, targetIds);

    // Get all targets before deletion to handle daily production reports
    const targetsToDelete = await prisma.target.findMany({
      where: {
        id: {
          in: targetIds
        }
      }
    });

    if (targetsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No targets found with provided IDs' },
        { status: 404 }
      );
    }

    console.log(`📊 Found ${targetsToDelete.length} targets to delete`);

    // Delete targets one by one and update daily production reports using the SAME logic as single delete
    const updatePromises = targetsToDelete.map(async (target) => {
      try {
        console.log(`🔄 Processing DELETE for target ${target.id} (Line ${target.lineNo}, Style ${target.styleNo})`);
        
        // Use the same date reconstruction logic as single delete
        const storedDate = new Date(target.date);
        const year = storedDate.getFullYear();
        const month = String(storedDate.getMonth() + 1).padStart(2, '0');
        const day = String(storedDate.getDate()).padStart(2, '0');
        const originalDateString = `${year}-${month}-${day}`;
        
        // Call the SAME service method that works for single delete
        await DailyProductionService.handleTargetProduction({
          targetId: target.id,
          styleNo: target.styleNo,
          lineNo: target.lineNo,
          dateString: originalDateString,
          hourlyProduction: target.hourlyProduction,
          lineTarget: target.lineTarget,
          action: 'DELETE'
        });
        
        console.log(`✅ Updated daily production for target ${target.id}`);
      } catch (error) {
        console.error(`❌ Error updating daily production for target ${target.id}:`, error);
        // Continue with deletion even if daily production update fails
      }
    });

    // Wait for all daily production updates to complete
    await Promise.all(updatePromises);
    console.log(`📈 Completed daily production updates for ${targetsToDelete.length} targets`);

    // Delete all targets
    const deleteResult = await prisma.target.deleteMany({
      where: {
        id: {
          in: targetIds
        }
      }
    });

    console.log(`🎉 Successfully deleted ${deleteResult.count} targets`);

    const response = NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} target(s)`,
      deletedCount: deleteResult.count
    });
    
    // Add cache-busting headers to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('Error in bulk delete targets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete targets' 
      },
      { status: 500 }
    );
  }
}
