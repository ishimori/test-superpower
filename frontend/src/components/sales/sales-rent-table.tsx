"use client";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { resolveRowClass } from "@/components/ui/row-color-resolver";
import { EditableNumberCell } from "@/components/ui/editable-number-cell";
import { EditableTextCell } from "@/components/ui/editable-text-cell";
import { EditableDateCell } from "@/components/ui/editable-date-cell";
import { EditableCheckboxCell } from "@/components/ui/editable-checkbox-cell";
import { DataTableFooter } from "@/components/ui/data-table-footer";
import type { SalesRentRow } from "@/types/sales-rent";
import type { useTableEditing } from "@/hooks/use-table-editing";

interface Props {
  rows: SalesRentRow[];
  editing: ReturnType<typeof useTableEditing<SalesRentRow>>;
  isLoading: boolean;
}

export function SalesRentTable({ rows, editing, isLoading }: Props) {
  const { getCellValue, updateCell, dirtyIds } = editing;

  const columns: ColumnDef<SalesRentRow>[] = [
    { accessorKey: "display_order", header: "#", size: 40, cell: ({ row }) => <span className="text-slate-400 text-xs">{row.original.display_order}</span> },
    {
      accessorKey: "applied_at", header: "申込日", size: 110,
      cell: ({ row }) => <EditableDateCell value={getCellValue(row.original, "applied_at")} onChange={(v) => updateCell(row.original.id, "applied_at", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "employee_id", header: "社員名", size: 100,
      cell: ({ row }) => <EditableTextCell value={String(getCellValue(row.original, "employee_id") ?? "")} onChange={(v) => updateCell(row.original.id, "employee_id", v ? Number(v) : null)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "customer_name", header: "顧客名", size: 120,
      cell: ({ row }) => <EditableTextCell value={getCellValue(row.original, "customer_name")} onChange={(v) => updateCell(row.original.id, "customer_name", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "property_name", header: "物件名", size: 180,
      cell: ({ row }) => <EditableTextCell value={getCellValue(row.original, "property_name")} onChange={(v) => updateCell(row.original.id, "property_name", v)} disabled={row.original.is_closed} className="text-blue-600 hover:underline" />,
    },
    {
      accessorKey: "brokerage_fee", header: "仲介手数料", size: 100,
      cell: ({ row }) => <EditableNumberCell value={getCellValue(row.original, "brokerage_fee")} onChange={(v) => updateCell(row.original.id, "brokerage_fee", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "ad_fee", header: "広告料", size: 90,
      cell: ({ row }) => <EditableNumberCell value={getCellValue(row.original, "ad_fee")} onChange={(v) => updateCell(row.original.id, "ad_fee", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "payment_fee", header: "支払手数料", size: 100,
      cell: ({ row }) => <EditableNumberCell value={getCellValue(row.original, "payment_fee")} onChange={(v) => updateCell(row.original.id, "payment_fee", v)} disabled={row.original.is_closed} />,
    },
    { accessorKey: "total_sales", header: "合計売上", size: 100, cell: ({ row }) => <EditableNumberCell value={row.original.total_sales} onChange={() => {}} disabled /> },
    {
      accessorKey: "received_at", header: "入金日", size: 110,
      cell: ({ row }) => <EditableDateCell value={getCellValue(row.original, "received_at")} onChange={(v) => updateCell(row.original.id, "received_at", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "is_white_flow", header: "白流れ", size: 60,
      cell: ({ row }) => <EditableCheckboxCell value={getCellValue(row.original, "is_white_flow")} onChange={(v) => updateCell(row.original.id, "is_white_flow", v)} disabled={row.original.is_closed} danger={getCellValue(row.original, "is_white_flow")} />,
    },
    { accessorKey: "fee_calculation", header: "手数料計算", size: 100, cell: ({ row }) => <EditableNumberCell value={row.original.fee_calculation} onChange={() => {}} disabled /> },
    {
      accessorKey: "delivered_at", header: "お届日", size: 110,
      cell: ({ row }) => <EditableDateCell value={getCellValue(row.original, "delivered_at")} onChange={(v) => updateCell(row.original.id, "delivered_at", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "is_delivery_flow", header: "お届流れ", size: 70,
      cell: ({ row }) => <EditableCheckboxCell value={getCellValue(row.original, "is_delivery_flow")} onChange={(v) => updateCell(row.original.id, "is_delivery_flow", v)} disabled={row.original.is_closed} />,
    },
    { accessorKey: "ad_calculation", header: "広告計算", size: 90, cell: ({ row }) => <EditableNumberCell value={row.original.ad_calculation} onChange={() => {}} disabled /> },
    { accessorKey: "total_summary", header: "合計総計", size: 100, cell: ({ row }) => <EditableNumberCell value={row.original.total_summary} onChange={() => {}} disabled /> },
  ];

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-slate-400">読み込み中...</div>;

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-slate-50 border-b-2 border-slate-200">
              {hg.headers.map((h) => (
                <th key={h.id} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap" style={{ width: h.getSize() }}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                dirtyIds.has(row.original.id) && "bg-yellow-50 hover:bg-yellow-100",
                resolveRowClass(row.original.status_flag)
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-1.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <DataTableFooter
            rows={rows as unknown as Record<string, unknown>[]}
            columns={[
              { key: "display_order", label: "合計" },
              { key: "applied_at", label: "" },
              { key: "employee_id", label: "" },
              { key: "customer_name", label: "" },
              { key: "property_name", label: "" },
              { key: "brokerage_fee", isSum: true, align: "right" },
              { key: "ad_fee", isSum: true, align: "right" },
              { key: "payment_fee", isSum: true, align: "right" },
              { key: "total_sales", isSum: true, align: "right" },
              { key: "received_at", label: "" },
              { key: "is_white_flow", label: "" },
              { key: "fee_calculation", isSum: true, align: "right" },
              { key: "delivered_at", label: "" },
              { key: "is_delivery_flow", label: "" },
              { key: "ad_calculation", isSum: true, align: "right" },
              { key: "total_summary", isSum: true, align: "right" },
            ]}
          />
        </tfoot>
      </table>
      {rows.length === 0 && (
        <div className="text-center py-12 text-slate-400">データがありません</div>
      )}
    </div>
  );
}
