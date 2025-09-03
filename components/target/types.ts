
export interface ComprehensiveTargetData {
  id: string;
  lineNo: string;
  lineName: string;
  styleNo: string;
  buyer: string;
  item: string;
  baseTarget: number; // Base target per hour
  totalHours: number; // Total working hours
  totalTargets: number; // Base target * total hours
  hourlyProduction: Record<string, number>;
  totalProduction: number;
  averageProductionPerHour: number;
  targetEntries: number; // Number of original target entries consolidated
}

export interface SummaryData {
  totalLines: number;
  totalTarget: number;
  totalProduction: number;
  averageProductionPerHour: number;
  totalConsolidatedEntries: number; // Number of consolidated rows
  totalOriginalEntries: number; // Total number of original target entries
  date: string;
}

export interface ComprehensiveReportResponse {
  success: boolean;
  data: ComprehensiveTargetData[];
  summary: SummaryData;
  timeSlotHeaders: string[];
  timeSlotTotals: Record<string, number>;
  message?: string;
  error?: string;
}
