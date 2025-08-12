export type ProductionStatus = "running" | "pending" | "complete";

export interface ProductionRecord {
  id: number;
  programCode: string;
  buyer: string;
  quantity: number;
  item: string;
  price: number;
  status: ProductionStatus;
}

export const productionData: ProductionRecord[] = [
  { id: 1, programCode: "PRG-001", buyer: "Buyer A", quantity: 1000, item: "Shirt", price: 10, status: "running" },
  { id: 2, programCode: "PRG-002", buyer: "Buyer B", quantity: 500, item: "Pants", price: 20, status: "pending" },
  { id: 3, programCode: "PRG-003", buyer: "Buyer C", quantity: 1500, item: "Jacket", price: 30, status: "complete" },
  { id: 4, programCode: "PRG-004", buyer: "Buyer D", quantity: 750, item: "T-Shirt", price: 15, status: "running" },
];
