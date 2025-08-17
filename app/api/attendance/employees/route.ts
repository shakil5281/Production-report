import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Department, ShiftType } from '@prisma/client';

// GET all employees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') as Department;
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: Record<string, unknown> = {};
    if (department) whereClause.department = department;
    if (isActive !== null) whereClause.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: whereClause,
        orderBy: [
          { department: 'asc' },
          { name: 'asc' }
        ],
        skip,
        take: limit,
      }),
      prisma.employee.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      employeeId, 
      name, 
      department, 
      designation, 
      shiftType, 
      salary, 
      joiningDate 
    } = body;

    // Validation
    if (!employeeId || !name || !department || !designation) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employeeId, name, department, designation' },
        { status: 400 }
      );
    }

    // Check if employee ID already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        department,
        designation,
        shiftType: shiftType || ShiftType.DAY_SHIFT,
        salary: salary ? parseFloat(salary) : null,
        joiningDate: joiningDate ? new Date(joiningDate) : null
      }
    });

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
