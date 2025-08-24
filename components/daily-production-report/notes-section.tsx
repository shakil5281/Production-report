'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyProductionReport } from './types';

interface NotesSectionProps {
  reports: DailyProductionReport[];
}

export function NotesSection({ reports }: NotesSectionProps) {
  // Get all reports with notes for the notes section
  const reportsWithNotes = reports.filter(r => r.notes);

  if (reportsWithNotes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Additional notes from production reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {reportsWithNotes.map((report) => (
            <div key={report.id} className="p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{report.styleNo}</Badge>
                <span className="text-sm text-muted-foreground">
                  {report.productionList.buyer}
                </span>
              </div>
              <p className="text-sm">{report.notes}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
