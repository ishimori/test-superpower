"use client";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface FooterColumn {
  key: string;
  label?: string;
  align?: "left" | "right";
  isSum?: boolean;
}

interface Props {
  rows: Record<string, unknown>[];
  columns: FooterColumn[];
  className?: string;
}

export function DataTableFooter({ rows, columns, className }: Props) {
  return (
    <tr className={cn("bg-slate-100 font-semibold text-sm border-t-2 border-slate-300", className)}>
      {columns.map((col) => {
        if (!col.isSum) {
          return <td key={col.key} className="px-3 py-2">{col.label ?? ""}</td>;
        }
        const sum = rows.reduce((acc, row) => acc + (Number(row[col.key]) || 0), 0);
        return (
          <td key={col.key} className={cn("px-3 py-2 tabular-nums", col.align === "right" ? "text-right" : "")}>
            {formatCurrency(sum)}
          </td>
        );
      })}
    </tr>
  );
}
