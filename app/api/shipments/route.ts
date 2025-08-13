import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

// GET /api/shipments - Get shipment reports with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const styleId = searchParams.get('styleId');
    const poNumber = searchParams.get('poNumber');
    const destination = searchParams.get('destination');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate) };
    } else if (endDate) {
      where.date = { lte: new Date(endDate) };
    }
    
    if (styleId) {
      where.styleId = styleId;
    }
    if (poNumber) {
      where.style = { poNumber: { contains: poNumber, mode: 'insensitive' } };
    }
    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          style: true
        },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.shipment.count({ where })
    ]);

    const normalizedShipments = shipments.map((s) => ({
      ...s,
      date: s.date.toISOString().split('T')[0],
      style: {
        ...s.style,
        unitPrice: Number(s.style.unitPrice),
      },
    }));

    // Calculate summary statistics
    const summary = {
      totalShipments: normalizedShipments.length,
      totalQuantity: normalizedShipments.reduce((sum, shipment) => sum + shipment.quantity, 0),
      totalValue: normalizedShipments.reduce((sum, shipment) => {
        return sum + (shipment.quantity * Number(shipment.style.unitPrice));
      }, 0),
      byDestination: normalizedShipments.reduce<Record<string, { destination: string; count: number; quantity: number; value: number }>>((acc, shipment) => {
        const dest = shipment.destination;
        if (!acc[dest]) {
          acc[dest] = { destination: dest, count: 0, quantity: 0, value: 0 };
        }
        acc[dest].count += 1;
        acc[dest].quantity += shipment.quantity;
        acc[dest].value += shipment.quantity * Number(shipment.style.unitPrice);
        return acc;
      }, {}),
      byStyle: normalizedShipments.reduce<Record<string, { styleNumber: string; buyer: string; poNumber: string; count: number; quantity: number; value: number }>>((acc, shipment) => {
        const styleKey = shipment.style.styleNumber;
        if (!acc[styleKey]) {
          acc[styleKey] = {
            styleNumber: shipment.style.styleNumber,
            buyer: shipment.style.buyer,
            poNumber: shipment.style.poNumber,
            count: 0,
            quantity: 0,
            value: 0
          };
        }
        acc[styleKey].count += 1;
        acc[styleKey].quantity += shipment.quantity;
        acc[styleKey].value += shipment.quantity * Number(shipment.style.unitPrice);
        return acc;
      }, {})
    };

    return NextResponse.json({
      shipments: normalizedShipments,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/shipments - Create new shipment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create shipments
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      date,
      styleId,
      quantity,
      destination,
      awbOrContainer,
      remarks
    } = body as {
      date: string;
      styleId: string;
      quantity: number;
      destination: string;
      awbOrContainer?: string | null;
      remarks?: string | null;
    };

    // Validate required fields
    if (!date || !styleId || !quantity || !destination) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if style exists
    const style = await prisma.style.findUnique({
      where: { id: styleId }
    });

    if (!style) {
      return NextResponse.json(
        { error: 'Style not found' },
        { status: 404 }
      );
    }

    // Check if shipment quantity doesn't exceed order quantity
    const existingShipments = await prisma.shipment.findMany({
      where: { styleId }
    });

    const totalShipped = existingShipments.reduce((sum, shipment) => sum + shipment.quantity, 0);
    
    if (totalShipped + quantity > style.orderQty) {
      return NextResponse.json(
        { 
          error: `Shipment quantity (${quantity}) plus already shipped (${totalShipped}) exceeds order quantity (${style.orderQty})` 
        },
        { status: 400 }
      );
    }

    // Create the shipment
    const shipment = await prisma.shipment.create({
      data: {
        date: new Date(date),
        styleId,
        quantity,
        destination,
        awbOrContainer: awbOrContainer || null,
        remarks: remarks || null
      },
      include: {
        style: true
      }
    });

    const normalizedShipment = {
      ...shipment,
      date: shipment.date.toISOString().split('T')[0],
      style: {
        ...shipment.style,
        unitPrice: Number(shipment.style.unitPrice),
      },
    };

    return NextResponse.json(normalizedShipment, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
