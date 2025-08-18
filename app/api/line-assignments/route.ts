import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/line-assignments - Get all line assignments
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('lineId');
    const styleNo = searchParams.get('styleNo');
    const status = searchParams.get('status');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Get all assignments with line and production list details
    let whereClause: any = {};
    
    if (lineId && lineId !== 'all') {
      whereClause.lineId = lineId;
    }
    
    if (activeOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.startDate = { lte: today };
      whereClause.OR = [
        { endDate: null },
        { endDate: { gte: today } }
      ];
    }

    // Get style assignments with related data
    const assignments = await prisma.styleAssignment.findMany({
      where: whereClause,
      include: {
        line: true,
        style: {
          select: {
            id: true,
            styleNumber: true,
            buyer: true,
            orderQty: true,
            unitPrice: true,
            status: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    // Get production list items - only show RUNNING styles
    let productionListWhere: any = {
      status: 'RUNNING' // Only show running styles
    };
    if (styleNo) {
      productionListWhere.styleNo = { contains: styleNo, mode: 'insensitive' };
    }

    const productionItems = await prisma.productionList.findMany({
      where: productionListWhere,
      orderBy: { createdAt: 'desc' }
    });

    // Get all lines
    const lines = await prisma.line.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        assignments,
        productionItems,
        lines,
        summary: {
          totalAssignments: assignments.length,
          activeAssignments: assignments.filter(a => !a.endDate || new Date(a.endDate) >= new Date()).length,
          totalLines: lines.length,
          totalProductionItems: productionItems.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching line assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch line assignments' },
      { status: 500 }
    );
  }
}

// POST /api/line-assignments - Create new line assignment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      lineId, 
      styleNo, 
      targetPerHour,
      assignmentType = 'PRODUCTION_LIST' // New field to distinguish assignment types
    } = body;

    // Validation
    if (!lineId || !styleNo) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: lineId, styleNo' },
        { status: 400 }
      );
    }

    // Set automatic start date to now and no end date for immediate assignment
    const start = new Date();
    const end = null;

    // Check if line exists
    const line = await prisma.line.findUnique({
      where: { id: lineId }
    });
    
    if (!line) {
      return NextResponse.json(
        { success: false, error: 'Line not found' },
        { status: 404 }
      );
    }

    // Check if production item exists
    const productionItem = await prisma.productionList.findUnique({
      where: { styleNo }
    });
    
    if (!productionItem) {
      return NextResponse.json(
        { success: false, error: 'Production item with this style number not found' },
        { status: 404 }
      );
    }

    // Check for existing active assignments on the same line
    const existingAssignment = await prisma.styleAssignment.findFirst({
      where: {
        lineId,
        OR: [
          { endDate: null },
          { endDate: { gte: start } }
        ]
      },
      include: {
        style: true
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Line is already assigned to style ${existingAssignment.style?.styleNumber || 'Unknown'}. Please remove the existing assignment first.` 
        },
        { status: 409 }
      );
    }

    // For now, we'll create a Style record that matches the ProductionList item
    // This is a bridge solution until we decide to fully migrate to ProductionList
    let styleRecord = await prisma.style.findFirst({
      where: { styleNumber: productionItem.styleNo }
    });

    if (!styleRecord) {
      // Create a corresponding Style record
      styleRecord = await prisma.style.create({
        data: {
          styleNumber: productionItem.styleNo,
          buyer: productionItem.buyer,
          poNumber: `PO-${productionItem.programCode}`,
          orderQty: productionItem.totalQty,
          unitPrice: productionItem.price,
          plannedStart: start,
          plannedEnd: end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
          status: productionItem.status === 'RUNNING' ? 'RUNNING' : 
                  productionItem.status === 'COMPLETE' ? 'COMPLETE' : 
                  productionItem.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING'
        }
      });
    }

    // Create the assignment
    const assignment = await prisma.styleAssignment.create({
      data: {
        lineId,
        styleId: styleRecord.id,
        startDate: start,
        endDate: end,
        targetPerHour: targetPerHour || 0
      },
      include: {
        line: true,
        style: true
      }
    });

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Line assignment created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating line assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create line assignment' },
      { status: 500 }
    );
  }
}
