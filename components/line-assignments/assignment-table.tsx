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
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <Badge className="bg-green-100 text-green-800">Active</Badge>
      </div>
    );
  }
  
  const config = {
    PENDING: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    RUNNING: { className: 'bg-blue-100 text-blue-800', label: 'Running' },
    COMPLETE: { className: 'bg-gray-100 text-gray-800', label: 'Complete' },
    CANCELLED: { className: 'bg-red-100 text-red-800', label: 'Cancelled' },
  }[status] || { className: 'bg-gray-100 text-gray-800', label: status };
  
  return <Badge className={config.className}>{config.label}</Badge>;
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
            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <TableHead className="font-semibold text-gray-700 py-4">Line</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Style</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Buyer</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Assigned</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Target/Hour</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Order Qty</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
              <TableHead className="w-24 font-semibold text-gray-700 py-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment, index) => (
              <TableRow key={assignment.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                {/* Line Info */}
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <div className="font-semibold text-gray-800">{assignment.line.name}</div>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 mt-1 w-fit">
                      {assignment.line.code}
                    </Badge>
                  </div>
                </TableCell>

                {/* Style Info */}
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <div className="font-semibold text-gray-800">{assignment.style.styleNumber}</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {formatPriceWithUnit(assignment.style.unitPrice)}
                    </div>
                  </div>
                </TableCell>

                {/* Buyer */}
                <TableCell className="py-4">
                  <div className="font-medium text-gray-800">{assignment.style.buyer}</div>
                </TableCell>

                {/* Assigned */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="p-1 bg-blue-100 rounded">
                      <IconCalendar className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700">{formatDate(assignment.startDate)}</span>
                  </div>
                  {isAssignmentActive(assignment) && (
                    <Badge className="bg-green-100 text-green-800 text-xs mt-2 flex items-center gap-1 w-fit">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      Active Now
                    </Badge>
                  )}
                </TableCell>

                {/* Target Per Hour */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-purple-100 rounded">
                      <IconTarget className="h-3 w-3 text-purple-600" />
                    </div>
                    <span className="font-mono font-semibold text-gray-800">{assignment.targetPerHour}</span>
                  </div>
                </TableCell>

                {/* Order Quantity */}
                <TableCell className="py-4">
                  <div className="font-mono font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {assignment.style.orderQty.toLocaleString()}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="py-4">
                  <StatusBadge assignment={assignment} />
                </TableCell>

                {/* Actions */}
                <TableCell className="py-4">
                  <div className="flex items-center gap-1">
                    <AlertDialog open={deleteId === assignment.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(assignment.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 border border-transparent hover:border-red-200 transition-all duration-200"
                        >
                          <IconTrash className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-0 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg font-semibold text-gray-800">Delete Assignment</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600">
                            Are you sure you want to delete this assignment? This will remove the assignment of style "{assignment.style.styleNumber}" from line "{assignment.line.name}".
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleting} className="border-2">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                          >
                            {deleting ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
