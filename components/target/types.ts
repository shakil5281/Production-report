
export interface ComprehensiveTargetData {
  id: string;
  lineNo: string;
  lineName: string;
  styleNo: string;
  buyer: string;
  item: string;
  target: number;
  hours: number;
  totalTargets: number;
  hourlyProduction: Record<string, number>;
  totalProduction: number;
  averageProductionPerHour: number;
}

export interface SummaryData {
  totalLines: number;
  totalTarget: number;
  totalProduction: number;
  averageProductionPerHour: number;
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
