import { NextRequest, NextResponse } from 'next/server';
import { productionService } from '@/lib/db/production';
import { getCurrentUser } from '@/lib/auth';

// GET /api/production/stats - Get production statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await productionService.getStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching production stats:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch production stats' },
      { status: 500 }
    );
  }
}
