import { NextRequest, NextResponse } from 'next/server';
import { productionService } from '@/lib/db/production';

// GET all production items or filter by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let items;
    if (status && ['PENDING', 'RUNNING', 'COMPLETE', 'CANCELLED'].includes(status)) {
      items = await productionService.getByStatus(status as any);
    } else {
      items = await productionService.getAll();
    }
    
    return NextResponse.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch production items' },
      { status: 500 }
    );
  }
}

// POST new production item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { programCode, styleNo, buyer, quantities, item, price, percentage, status } = body;

    // Validation
    if (!programCode || !styleNo || !buyer || !quantities || !item || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(quantities) || quantities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Quantities must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each quantity item
    for (const qty of quantities) {
      if (!qty.variant || !qty.color || !qty.qty || qty.qty <= 0) {
        return NextResponse.json(
          { success: false, error: 'Each quantity item must have variant, color, and positive qty' },
          { status: 400 }
        );
      }
    }

    if (price <= 0 || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Price must be positive, percentage must be between 0-100' },
        { status: 400 }
      );
    }

    // Check if style number already exists
    const styleNoExists = await productionService.styleNoExists(styleNo);
    if (styleNoExists) {
      return NextResponse.json(
        { success: false, error: 'Style No already exists' },
        { status: 400 }
      );
    }

    // Calculate total quantity
    const totalQty = quantities.reduce((total: number, item: any) => total + Number(item.qty), 0);

    // Create new production item
    const newItem = await productionService.create({
      programCode,
      styleNo,
      buyer,
      quantities,
      totalQty,
      item,
      price: Number(price),
      percentage: Number(percentage) || 0,
      status: status || 'PENDING'
    });

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Production item created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating production item:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create production item' },
      { status: 500 }
      );
  }
}
