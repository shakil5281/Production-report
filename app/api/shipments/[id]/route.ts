import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/shipments/[id] - Optional: fetch a specific shipment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { style: true },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const normalized = {
      ...shipment,
      date: shipment.date.toISOString().split('T')[0],
      style: { ...shipment.style, unitPrice: Number(shipment.style.unitPrice) },
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/shipments/[id] - Update shipment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      date?: string;
      styleId?: string;
      quantity?: number;
      destination?: string;
      awbOrContainer?: string | null;
      remarks?: string | null;
    };

    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (quantity !== undefined && quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }

    let styleToUseId = existing.styleId;
    if (styleId && styleId !== existing.styleId) {
      const style = await prisma.style.findUnique({ where: { id: styleId } });
      if (!style) {
        return NextResponse.json({ error: 'Style not found' }, { status: 404 });
      }
      styleToUseId = styleId;
    }

    // Check total shipped constraint if quantity or style changed
    if ((quantity !== undefined && quantity !== existing.quantity) || styleToUseId !== existing.styleId) {
      const style = await prisma.style.findUnique({ where: { id: styleToUseId } });
      if (!style) {
        return NextResponse.json({ error: 'Style not found' }, { status: 404 });
      }
      const shipments = await prisma.shipment.findMany({ where: { styleId: styleToUseId } });
      const totalShippedExcluding = shipments
        .filter((s) => s.id !== id)
        .reduce((sum, s) => sum + s.quantity, 0);
      const newQty = quantity ?? existing.quantity;
      if (totalShippedExcluding + newQty > style.orderQty) {
        return NextResponse.json(
          { error: `Shipment quantity (${newQty}) plus already shipped (${totalShippedExcluding}) exceeds order quantity (${style.orderQty})` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        styleId: styleId ?? undefined,
        quantity: quantity ?? undefined,
        destination: destination ?? undefined,
        awbOrContainer: awbOrContainer ?? undefined,
        remarks: remarks ?? undefined,
      },
      include: { style: true },
    });

    const normalized = {
      ...updated,
      date: updated.date.toISOString().split('T')[0],
      style: { ...updated.style, unitPrice: Number(updated.style.unitPrice) },
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/shipments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    await prisma.shipment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}