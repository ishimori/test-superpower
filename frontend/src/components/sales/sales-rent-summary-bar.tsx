import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { SalesRentRow } from "@/types/sales-rent";

interface Props {
  rows: SalesRentRow[];
  className?: string;
}

export function SalesRentSummaryBar({ rows, className }: Props) {
  const totalSales = rows.reduce((sum, r) => sum + r.total_sales, 0);
  return (
    <div className={cn("px-4 py-1.5 text-xs text-slate-600 bg-slate-50 border-b flex items-center gap-4", className)}>
      <span>{rows.length} 件</span>
      <span>合計売上: <strong className="text-slate-800">{formatCurrency(totalSales)}</strong></span>
    </div>
  );
}
