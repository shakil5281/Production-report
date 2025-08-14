import { NextRequest, NextResponse } from 'next/server';
import { productionService } from '@/lib/db/production';

// GET production item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await productionService.getById(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Production item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('Error fetching production item:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch production item' },
      { status: 500 }
    );
  }
}

// PUT update production item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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



    // Check if style number already exists for other items
    const styleNoExists = await productionService.styleNoExists(styleNo, id);
    if (styleNoExists) {
      return NextResponse.json(
        { success: false, error: 'Style No already exists' },
        { status: 400 }
      );
    }

    // Update the item
    const updatedItem = await productionService.update(id, {
      programCode,
      styleNo,
      buyer,
      quantity: Number(quantity),
      item,
      price: Number(price),
      percentage: Number(percentage) || 0,
      status
    });

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Production item updated successfully'
    });

  } catch (error) {
    console.error('Error updating production item:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update production item' },
      { status: 500 }
    );
  }
}

// DELETE production item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedItem = await productionService.delete(id);

    return NextResponse.json({
      success: true,
      data: deletedItem,
      message: 'Production item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting production item:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete production item' },
      { status: 500 }
    );
  }
}
