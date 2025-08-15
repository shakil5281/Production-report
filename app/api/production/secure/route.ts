import { NextRequest, NextResponse } from 'next/server';
import { PermissionType } from '@prisma/client';
import { withPermission } from '@/lib/middleware/permission-guard';

// Example: Production data API with permission checking
async function handleProductionRead(req: NextRequest) {
  // This handler only executes if user has READ_PRODUCTION permission
  return NextResponse.json({
    success: true,
    message: 'Production data accessed successfully',
    data: {
      // Mock production data
      productions: [
        { id: 1, styleNo: 'ST001', quantity: 1000, status: 'Running' },
        { id: 2, styleNo: 'ST002', quantity: 500, status: 'Pending' },
      ]
    }
  });
}

async function handleProductionWrite(req: NextRequest) {
  // This handler only executes if user has CREATE_PRODUCTION permission
  const body = await req.json();
  
  return NextResponse.json({
    success: true,
    message: 'Production data created successfully',
    data: {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString()
    }
  });
}

// GET - Read production data (requires READ_PRODUCTION permission)
export const GET = withPermission([PermissionType.READ_PRODUCTION])(handleProductionRead);

// POST - Create production data (requires CREATE_PRODUCTION permission)
export const POST = withPermission([PermissionType.CREATE_PRODUCTION])(handleProductionWrite);
