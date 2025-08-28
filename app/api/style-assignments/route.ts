import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

// GET /api/style-assignments - List style assignments (targets)
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const lineId = searchParams.get('lineId');
		const styleId = searchParams.get('styleId');
		const dateParam = searchParams.get('date');
		const activeOnly = searchParams.get('activeOnly') === 'true';
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '50');
		const skip = (page - 1) * limit;

		const where: Prisma.StyleAssignmentWhereInput = {};
		if (lineId && lineId !== 'all') where.lineId = lineId;
		if (styleId && styleId !== 'all') where.styleId = styleId;

		// Active on date filter
		if (dateParam) {
			const date = new Date(dateParam + 'T00:00:00Z');
			if (isNaN(date.getTime())) {
				return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
			}
			where.AND = [
				{ startDate: { lte: date } },
				{ OR: [{ endDate: null }, { endDate: { gte: date } }] },
			];
		}

		if (activeOnly && !dateParam) {
			const today = new Date();
			today.setUTCHours(0, 0, 0, 0);
			where.AND = [
				{ startDate: { lte: today } },
				{ OR: [{ endDate: null }, { endDate: { gte: today } }] },
			];
		}

		const [assignments, total] = await Promise.all([
			prisma.styleAssignment.findMany({
				where,
				include: {
					line: true,
					style: true,
				},
				orderBy: [{ startDate: 'desc' }],
				skip,
				take: limit,
			}),
			prisma.styleAssignment.count({ where }),
		]);

		return NextResponse.json({
			assignments,
			pagination: { page, limit, total, pages: Math.ceil(total / limit) },
		});
	} catch (error) {
		console.error('Error fetching style assignments:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// POST /api/style-assignments - Create new style assignment (target)
export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		    if (!user.role || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions - SUPER_ADMIN access required' }, { status: 403 });
    }

		const body = await request.json();
		const { lineId, styleId, startDate, endDate, targetPerHour } = body as {
			lineId: string;
			styleId: string;
			startDate: string;
			endDate?: string | null;
			targetPerHour?: number | null;
		};

		if (!lineId || !styleId || !startDate) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		const start = new Date(startDate + 'T00:00:00Z');
		const end = endDate ? new Date(endDate + 'T00:00:00Z') : null;
		if (isNaN(start.getTime()) || (endDate && end && isNaN(end.getTime()))) {
			return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
		}

		if (targetPerHour !== null && targetPerHour !== undefined && targetPerHour < 0) {
			return NextResponse.json({ error: 'targetPerHour must be >= 0' }, { status: 400 });
		}

		// Check for overlapping assignments for same line/style
		const overlap = await prisma.styleAssignment.findFirst({
			where: {
				lineId,
				styleId,
				AND: [
					{ startDate: { lte: end ?? new Date('9999-12-31') } },
					{ OR: [
						{ endDate: null },
						{ endDate: { gte: start } },
					] },
				],
			},
		});
		if (overlap) {
			return NextResponse.json({ error: 'Overlapping assignment exists for this line and style' }, { status: 409 });
		}

		const assignment = await prisma.styleAssignment.create({
			data: {
				lineId,
				styleId,
				startDate: start,
				endDate: end,
				targetPerHour: targetPerHour ?? 0,
			},
			include: { line: true, style: true },
		});

		return NextResponse.json(assignment, { status: 201 });
	} catch (error) {
		console.error('Error creating style assignment:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}