export interface DailyTargetData {
  id: string;
  lineNo: string;
  styleNo: string;
  buyer: string;
  item: string;
  lineTarget: number;
  totalTarget: number;
  hourlyProduction: {
    '8-9': number;
    '9-10': number;
    '10-11': number;
    '11-12': number;
    '12-1': number;
    '1-2': number;
    '2-3': number;
    '3-4': number;
    '4-5': number;
    '5-6': number;
    '6-7': number;
    '7-8': number;
  };
  totalProduction: number;
  averageProductionPerHour: number;
}

export interface DailyTargetSummaryProps {
  data: DailyTargetData[];
  selectedDate: Date;
}

export interface DailyTargetReportTableProps {
  data: DailyTargetData[];
  loading: boolean;
  selectedDate: Date;
}

export interface ComprehensiveTargetData {
  id: string;
  lineNo: string;
  lineName: string;
  styleNo: string;
  buyer: string;
  item: string;
  target: number;
  hours: number;
  targets: number;
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
