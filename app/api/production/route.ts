import { NextRequest, NextResponse } from 'next/server';
import { productionService } from '@/lib/db/production';

// GET all production items with advanced filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const buyer = searchParams.get('buyer');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Build filters object
    const filters = {
      status: status && ['PENDING', 'RUNNING', 'COMPLETE', 'CANCELLED'].includes(status) ? status : undefined,
      search: search || undefined,
      buyer: buyer || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };
    
    // Get filtered and paginated items
    const result = await productionService.getFilteredPaginated({
      filters,
      page,
      limit,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    });
    
    return NextResponse.json({
      success: true,
      data: result.items,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
      hasMore: page * limit < result.total
    });
  } catch (error) {
    console.error('Error fetching production items:', error);
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
