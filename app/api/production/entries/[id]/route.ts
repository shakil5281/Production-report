import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/production/entries/[id] - Get specific production entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await prisma.productionEntry.findUnique({
      where: { id },
      include: {
        line: true,
        style: true
      }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Production entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching production entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/production/entries/[id] - Update production entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update production entries
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      inputQty,
      outputQty,
      defectQty,
      reworkQty,
      notes
    } = body;

    // Check if entry exists
    const existingEntry = await prisma.productionEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Production entry not found' }, { status: 404 });
    }

    // Update the production entry
    const updatedEntry = await prisma.productionEntry.update({
      where: { id },
      data: {
        inputQty: inputQty !== undefined ? inputQty : existingEntry.inputQty,
        outputQty: outputQty !== undefined ? outputQty : existingEntry.outputQty,
        defectQty: defectQty !== undefined ? defectQty : existingEntry.defectQty,
        reworkQty: reworkQty !== undefined ? reworkQty : existingEntry.reworkQty,
        notes: notes !== undefined ? notes : existingEntry.notes
      },
      include: {
        line: true,
        style: true
      }
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error updating production entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/production/entries/[id] - Delete production entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete production entries
    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if entry exists
    const existingEntry = await prisma.productionEntry.findUnique({
      where: { id }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Production entry not found' }, { status: 404 });
    }

    // Delete the production entry
    await prisma.productionEntry.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Production entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting production entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
