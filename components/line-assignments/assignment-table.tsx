'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { IconTrash, IconEdit, IconClock, IconCalendar, IconTarget } from '@tabler/icons-react';

import type { LineAssignment } from './schema';
import { formatDate, formatDateRange, isAssignmentActive, formatPriceWithUnit } from './schema';

interface AssignmentTableProps {
  assignments: LineAssignment[];
  loading?: boolean;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh: () => void;
}

function StatusBadge({ assignment }: { assignment: LineAssignment }) {
  const isActive = isAssignmentActive(assignment);
  const status = assignment.style.status;
  
  if (isActive && status === 'RUNNING') {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <Badge variant="secondary">Active</Badge>
      </div>
    );
  }
  
  const config = {
    PENDING: { variant: 'outline', label: 'Pending' },
    RUNNING: { variant: 'secondary', label: 'Running' },
    COMPLETE: { variant: 'outline', label: 'Complete' },
    CANCELLED: { variant: 'destructive', label: 'Cancelled' },
  }[status] || { variant: 'outline', label: status };
  
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}

export function AssignmentTable({ assignments, loading, onDelete, onRefresh }: AssignmentTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      const success = await onDelete(deleteId);
      if (success) {
        setDeleteId(null);
        onRefresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading assignments...</div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <IconCalendar className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-lg font-medium text-muted-foreground">No assignments found</div>
        <div className="text-sm text-muted-foreground">Create your first line assignment to get started</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Line</TableHead>
              <TableHead>Style</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Target/Hour</TableHead>
              <TableHead>Order Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                {/* Line Info */}
                <TableCell>
                  <div className="flex flex-col">
                    <div className="font-medium">{assignment.line.name}</div>
                    <Badge variant="outline" className="text-xs mt-1 w-fit">
                      {assignment.line.code}
                    </Badge>
                  </div>
                </TableCell>

                {/* Style Info */}
                <TableCell>
                  <div className="flex flex-col">
                    <div className="font-medium">{assignment.style.styleNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatPriceWithUnit(assignment.style.unitPrice)}
                    </div>
                  </div>
                </TableCell>

                {/* Buyer */}
                <TableCell>
                  <div className="font-medium">{assignment.style.buyer}</div>
                </TableCell>

                {/* Assigned */}
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <IconCalendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(assignment.startDate)}</span>
                  </div>
                  {isAssignmentActive(assignment) && (
                    <Badge variant="secondary" className="text-xs mt-2 w-fit">
                      Active Now
                    </Badge>
                  )}
                </TableCell>

                {/* Target Per Hour */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconTarget className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono">{assignment.targetPerHour}</span>
                  </div>
                </TableCell>

                {/* Order Quantity */}
                <TableCell>
                  <div className="font-mono">
                    {assignment.style.orderQty.toLocaleString()}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge assignment={assignment} />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <AlertDialog open={deleteId === assignment.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(assignment.id)}
                        className="h-8 w-8 p-0"
                      >
                        <IconTrash className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this assignment? This will remove the assignment of style "{assignment.style.styleNumber}" from line "{assignment.line.name}".
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
