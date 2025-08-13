import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/style-assignments/[id]
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const assignment = await prisma.styleAssignment.findUnique({
			where: { id },
			include: { line: { include: { factory: true } }, style: true },
		});
		if (!assignment) {
			return NextResponse.json({ error: 'Style assignment not found' }, { status: 404 });
		}
		return NextResponse.json(assignment);
	} catch (error) {
		console.error('Error fetching style assignment:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// PUT /api/style-assignments/[id]
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (!['ADMIN', 'MANAGER'].includes(user.role)) {
			return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		const { id } = await params;
		const body = await request.json();
		const { startDate, endDate, targetPerHour } = body as {
			startDate?: string;
			endDate?: string | null;
			targetPerHour?: number | null;
		};

		const existing = await prisma.styleAssignment.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json({ error: 'Style assignment not found' }, { status: 404 });
		}

		let start = existing.startDate;
		let end = existing.endDate ?? null;
		if (startDate) {
			const parsed = new Date(startDate + 'T00:00:00Z');
			if (isNaN(parsed.getTime())) {
				return NextResponse.json({ error: 'Invalid startDate' }, { status: 400 });
			}
			start = parsed;
		}
		if (endDate !== undefined) {
			if (endDate === null) {
				end = null;
			} else {
				const parsed = new Date(endDate + 'T00:00:00Z');
				if (isNaN(parsed.getTime())) {
					return NextResponse.json({ error: 'Invalid endDate' }, { status: 400 });
				}
				end = parsed;
			}
		}
		if (targetPerHour !== undefined && targetPerHour !== null && targetPerHour < 0) {
			return NextResponse.json({ error: 'targetPerHour must be >= 0' }, { status: 400 });
		}

		const updated = await prisma.styleAssignment.update({
			where: { id },
			data: {
				startDate: start,
				endDate: end,
				targetPerHour: targetPerHour ?? existing.targetPerHour ?? 0,
			},
			include: { line: { include: { factory: true } }, style: true },
		});
		return NextResponse.json(updated);
	} catch (error) {
		console.error('Error updating style assignment:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// DELETE /api/style-assignments/[id]
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (!['ADMIN'].includes(user.role)) {
			return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		const { id } = await params;
		await prisma.styleAssignment.delete({ where: { id } });
		return NextResponse.json({ message: 'Style assignment deleted successfully' });
	} catch (error) {
		console.error('Error deleting style assignment:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}