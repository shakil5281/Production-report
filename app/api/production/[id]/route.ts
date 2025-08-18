import { NextRequest, NextResponse } from 'next/server';
import { productionService } from '@/lib/db/production';
import { getCurrentUser } from '@/lib/auth';

// GET production item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    if (price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be positive' },
        { status: 400 }
      );
    }
    
    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return NextResponse.json(
        { success: false, error: 'Percentage must be between 0-100' },
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

    // Calculate total quantity
    const totalQty = quantities.reduce((total: number, item: any) => total + Number(item.qty), 0);

    // Update the item
    console.log('Updating production item with data:', {
      id,
      programCode,
      styleNo,
      buyer,
      quantities,
      totalQty,
      item,
      price: Number(price),
      percentage: Number(percentage) || 0,
      status
    });
    
    const updatedItem = await productionService.update(id, {
      programCode,
      styleNo,
      buyer,
      quantities,
      totalQty,
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
    
    // Handle specific errors
    if (error instanceof Error) {
      // If it's a known error with a specific message, return that
      if (error.message.includes('Style No already exists') || 
          error.message.includes('Production item not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }
    
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
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
