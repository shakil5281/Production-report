import { TableRow, TableCell } from "@/components/ui/table";
import { ProductionRecord } from "../data/productionData";

interface Props {
  row: ProductionRecord;
}

export function TableRowItem({ row }: Props) {
  return (
    <TableRow>
      <TableCell>{row.id}</TableCell>
      <TableCell>{row.programCode}</TableCell>
      <TableCell>{row.buyer}</TableCell>
      <TableCell>{row.quantity}</TableCell>
      <TableCell>{row.item}</TableCell>
      <TableCell>${row.price}</TableCell>
    </TableRow>
  );
}
