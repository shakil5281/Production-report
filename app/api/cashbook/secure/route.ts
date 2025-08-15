import { NextRequest, NextResponse } from 'next/server';
import { PermissionType, UserRole } from '@prisma/client';
import { withCashbookManagerAccess } from '@/lib/middleware/permission-guard';

// Example: Cashbook data API with role-based access
async function handleCashbookData(req: NextRequest) {
  // This handler only executes if user is CASHBOOK_MANAGER, ADMIN, or SUPER_ADMIN
  
  if (req.method === 'GET') {
    return NextResponse.json({
      success: true,
      message: 'Cashbook data accessed successfully',
      data: {
        // Mock cashbook data
        entries: [
          { id: 1, date: '2024-01-15', type: 'DEBIT', amount: 5000, description: 'Material Purchase' },
          { id: 2, date: '2024-01-15', type: 'CREDIT', amount: 15000, description: 'Sales Revenue' },
        ],
        balance: 10000
      }
    });
  }
  
  if (req.method === 'POST') {
    const body = await req.json();
    
    return NextResponse.json({
      success: true,
      message: 'Cashbook entry created successfully',
      data: {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      }
    });
  }
  
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

// All methods protected by cashbook manager access
export const GET = withCashbookManagerAccess(handleCashbookData);
export const POST = withCashbookManagerAccess(handleCashbookData);
export const PUT = withCashbookManagerAccess(handleCashbookData);
export const DELETE = withCashbookManagerAccess(handleCashbookData);
