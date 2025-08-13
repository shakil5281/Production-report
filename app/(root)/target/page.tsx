'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { IconTarget, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';

interface Line {
	id: string;
	name: string;
	code: string;
	factory: { name: string };
}

interface Style { id: string; styleNumber: string; buyer: string }

interface StyleAssignment {
	id: string;
	lineId: string;
	styleId: string;
	startDate: string;
	endDate?: string | null;
	targetPerHour?: number | null;
	line: Line;
	style: Style;
}

interface ProductionEntry {
	id: string;
	date: string;
	hourIndex: number;
	lineId: string;
	styleId: string;
	stage: 'CUTTING' | 'SEWING' | 'FINISHING';
	inputQty: number;
	outputQty: number;
	defectQty: number;
	reworkQty: number;
}

export default function TargetPage() {
	const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
	const [stage, setStage] = useState<'CUTTING' | 'SEWING' | 'FINISHING'>('SEWING');
	const [lines, setLines] = useState<Line[]>([]);
	const [assignments, setAssignments] = useState<StyleAssignment[]>([]);
	const [entries, setEntries] = useState<ProductionEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [editing, setEditing] = useState<StyleAssignment | null>(null);
	const [form, setForm] = useState({
		lineId: '',
		styleId: '',
		startDate: new Date().toISOString().split('T')[0],
		endDate: '' as string | '' ,
		targetPerHour: 0,
	});

	const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 8), []); // 8..19

	const fetchAll = useCallback(async () => {
		try {
			setLoading(true);
			const [linesRes, assignmentsRes, entriesRes, stylesRes] = await Promise.all([
				fetch('/api/lines'),
				fetch(`/api/style-assignments?date=${date}`),
				fetch(`/api/production/entries?date=${date}`),
				fetch('/api/styles?limit=100'),
			]);
			if (!linesRes.ok || !assignmentsRes.ok || !entriesRes.ok || !stylesRes.ok) {
				throw new Error('Failed to load data');
			}
			const [linesData, assignmentsData, entriesData, stylesData] = await Promise.all([
				linesRes.json(),
				assignmentsRes.json(),
				entriesRes.json(),
				stylesRes.json(),
			]);
			setLines(linesData || []);
			setAssignments(assignmentsData.assignments || []);
			setEntries(entriesData.entries || []);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Error');
		} finally {
			setLoading(false);
		}
	}, [date]);

	useEffect(() => { fetchAll(); }, [fetchAll]);

	const resetForm = () => {
		setEditing(null);
		setForm({ lineId: '', styleId: '', startDate: date, endDate: '', targetPerHour: 0 });
	};

	const handleCreateOrUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const body = {
				lineId: form.lineId,
				styleId: form.styleId,
				startDate: form.startDate,
				endDate: form.endDate || null,
				targetPerHour: Number(form.targetPerHour) || 0,
			};
			const res = await fetch(editing ? `/api/style-assignments/${editing.id}` : '/api/style-assignments', {
				method: editing ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || 'Failed');
			}
			await fetchAll();
			setIsSheetOpen(false);
			resetForm();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Error');
		}
	};

	const handleEdit = (a: StyleAssignment) => {
		setEditing(a);
		setForm({
			lineId: a.lineId,
			styleId: a.styleId,
			startDate: a.startDate.split('T')[0],
			endDate: a.endDate ? a.endDate.split('T')[0] : '',
			targetPerHour: a.targetPerHour ?? 0,
		});
		setIsSheetOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Delete this target?')) return;
		try {
			const res = await fetch(`/api/style-assignments/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || 'Failed');
			}
			await fetchAll();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Error');
		}
	};

	// Aggregate output per hour per line for selected stage
	const outputByHourAndLine = useMemo(() => {
		const map: Record<string, Record<number, number>> = {};
		for (const line of lines) map[line.id] = {};
		for (const entry of entries) {
			if (entry.stage !== stage) continue;
			if (!map[entry.lineId]) map[entry.lineId] = {};
			map[entry.lineId][entry.hourIndex] = (map[entry.lineId][entry.hourIndex] || 0) + (entry.outputQty || 0);
		}
		return map;
	}, [entries, lines, stage]);

	const targetPerLine = useMemo(() => {
		const map: Record<string, number> = {};
		assignments.forEach(a => { map[a.lineId] = a.targetPerHour ?? 0; });
		return map;
	}, [assignments]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Production Targets</h1>
				<p className="text-muted-foreground">Set targets and monitor per-hour output by line</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<IconTarget className="h-5 w-5" />
						Controls
					</CardTitle>
					<CardDescription>Filters and target management</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-4">
					<div className="space-y-2">
						<Label htmlFor="date">Date</Label>
						<Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
					</div>
					<div className="space-y-2">
						<Label>Stage</Label>
						<Select value={stage} onValueChange={(v: 'CUTTING' | 'SEWING' | 'FINISHING') => setStage(v)}>
							<SelectTrigger>
								<SelectValue placeholder="Select stage" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="CUTTING">Cutting</SelectItem>
								<SelectItem value="SEWING">Sewing</SelectItem>
								<SelectItem value="FINISHING">Finishing</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2 md:col-span-2 flex items-end justify-end">
						<Sheet open={isSheetOpen} onOpenChange={(o) => { if (!o) resetForm(); setIsSheetOpen(o); }}>
							<Button onClick={() => setIsSheetOpen(true)} className="w-full md:w-auto">
								<IconPlus className="h-4 w-4 mr-2" />
								{editing ? 'Edit Target' : 'Add Target'}
							</Button>
							<SheetContent side="right" className="w-[600px] sm:w-[600px]">
								<SheetHeader>
									<SheetTitle>{editing ? 'Edit Target' : 'Add Target'}</SheetTitle>
									<SheetDescription>Line-Style assignment and hourly target</SheetDescription>
								</SheetHeader>
								<form onSubmit={handleCreateOrUpdate} className="mt-6 space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Line</Label>
											<Select value={form.lineId} onValueChange={(v) => setForm({ ...form, lineId: v })}>
												<SelectTrigger>
													<SelectValue placeholder="Select line" />
												</SelectTrigger>
												<SelectContent>
													{lines.map(l => (
														<SelectItem key={l.id} value={l.id}>{l.factory.name} - {l.code}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Style</Label>
											{/* Keep a light style selector: reuse styles from API via datalist */}
											<Input list="styles-list" value={form.styleId} onChange={(e) => setForm({ ...form, styleId: e.target.value })} placeholder="Paste styleId or choose" />
											<datalist id="styles-list"></datalist>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Start Date</Label>
											<Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
										</div>
										<div className="space-y-2">
											<Label>End Date</Label>
											<Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
										</div>
									</div>
									<div className="space-y-2">
										<Label>Target per hour</Label>
										<Input type="number" min={0} value={form.targetPerHour} onChange={(e) => setForm({ ...form, targetPerHour: Number(e.target.value) })} />
									</div>
									<div className="flex justify-end gap-2 pt-4">
										<Button type="button" variant="outline" onClick={() => { setIsSheetOpen(false); resetForm(); }}>Cancel</Button>
										<Button type="submit">{editing ? 'Update' : 'Create'}</Button>
									</div>
								</form>
							</SheetContent>
						</Sheet>
					</div>
				</CardContent>
			</Card>

			{/* Per-hour production grid */}
			<Card>
				<CardHeader>
					<CardTitle>Per-hour Production by Line</CardTitle>
					<CardDescription>{date} — Stage: {stage}</CardDescription>
				</CardHeader>
				<CardContent>
					<ScrollArea className="w-full overflow-auto">
						<div className="min-w-[700px]">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="text-left py-2 px-2">Hour</th>
										{lines.map(l => (
											<th key={l.id} className="text-center py-2 px-2">
												<div className="flex items-center justify-center gap-2">
													{l.code}
													{(targetPerLine[l.id] ?? 0) > 0 && (
														<Badge variant="secondary">Target {targetPerLine[l.id]}</Badge>
													)}
												</div>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{hours.map(h => (
											<tr key={h} className="border-b">
												<td className="py-2 px-2 font-medium">{String(h).padStart(2,'0')}:00 - {String((h+1)%24).padStart(2,'0')}:00</td>
												{lines.map(l => {
													const actual = outputByHourAndLine[l.id]?.[h] || 0;
													const target = targetPerLine[l.id] || 0;
													return (
														<td key={l.id + '-' + h} className="text-center py-2 px-2">
															<div className="inline-flex items-center gap-2">
																<span className={actual >= target && target > 0 ? 'text-green-600' : 'text-foreground'}>{actual}</span>
																{target > 0 && <span className="text-muted-foreground">/ {target}</span>}
															</div>
														</td>
													);
												})}
											</tr>
									))}
								</tbody>
							</table>
						</div>
					</ScrollArea>
				</CardContent>
			</Card>

			{/* Active assignments list with edit/delete */}
			<Card>
				<CardHeader>
					<CardTitle>Active Targets</CardTitle>
					<CardDescription>Assignments active on {date}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{assignments.length === 0 && <div className="text-muted-foreground">No active targets.</div>}
					{assignments.map(a => (
						<div key={a.id} className="flex items-center justify-between rounded-md border p-3">
							<div className="flex flex-col">
								<span className="font-medium">{a.line.factory.name} / {a.line.code} → {a.style.styleNumber}</span>
								<span className="text-xs text-muted-foreground">Target {a.targetPerHour ?? 0} per hour • {a.startDate.split('T')[0]}{a.endDate ? ` - ${a.endDate.split('T')[0]}` : ''}</span>
							</div>
							<div className="flex gap-2">
								<Button size="sm" variant="outline" onClick={() => handleEdit(a)}>
									<IconEdit className="h-4 w-4" />
								</Button>
								<Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(a.id)}>
									<IconTrash className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</CardContent>
			</Card>

			{error && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="pt-6 text-red-700">{error}</CardContent>
				</Card>
			)}
		</div>
	);
}
