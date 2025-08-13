import { NextRequest, NextResponse } from 'next/server';
import { productionService } from '@/lib/db/production';

// GET all production items
export async function GET() {
  try {
    const items = await productionService.getAll();
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
    const { programCode, buyer, quantity, item, price, status, notes } = body;

    // Validation
    if (!programCode || !buyer || !quantity || !item || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (quantity <= 0 || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity and price must be positive numbers' },
        { status: 400 }
      );
    }

    // Check if program code already exists
    const exists = await productionService.programCodeExists(programCode);
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'Program code already exists' },
        { status: 400 }
      );
    }

    // Create new production item
    const newItem = await productionService.create({
      programCode,
      buyer,
      quantity: Number(quantity),
      item,
      price: Number(price),
      status: status || 'PENDING',
      notes
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
