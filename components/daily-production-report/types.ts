export interface DailyProductionReport {
  id: string;
  date: string;
  styleNo: string;
  targetQty: number;
  productionQty: number;
  unitPrice: number;
  totalAmount: number;
  netAmount: number;
  lineNo: string | null;
  notes: string | null;
  productionList: {
    buyer: string;
    item: string;
    price: number;
    totalQty: number;
  };
}

export interface ProductionSummary {
  totalReports: number;
  totalTargetQty: number;
  totalProductionQty: number;
  totalAmount: number;
  totalNetAmount: number;
  totalLines: number;
  linesWithProduction: number;
}

export interface LineSummary {
  lineNo: string;
  totalReports: number;
  totalTargetQty: number;
  totalProductionQty: number;
  totalAmount: number;
  totalNetAmount: number;
}

export interface ExportDataRow {
  'LINE': string;
  'P/COD': string;
  'BUYER': string;
  'ART/NO': string;
  'OR/QTY': number;
  'ITEM': string;
  'DAILY TARGET': number;
  'DAILY PRODUCTION': number;
  'UNIT PRICE': string;
  'TOTAL PRICE': string;
  '%': number;
  '% Dollar': string;
  'Taka': string;
  'Remarks': string;
}
