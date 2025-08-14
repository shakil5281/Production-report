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
    const { programCode, styleNo, buyer, quantity, item, price, percentage, status } = body;

    // Validation
    if (!programCode || !styleNo || !buyer || !quantity || !item || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (quantity <= 0 || price <= 0 || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Quantity and price must be positive numbers, percentage must be between 0-100' },
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

    // Create new production item
    const newItem = await productionService.create({
      programCode,
      styleNo,
      buyer,
      quantity: Number(quantity),
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
