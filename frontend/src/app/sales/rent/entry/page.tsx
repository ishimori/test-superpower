"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SalesRentHeader } from "@/components/sales/sales-rent-header";
import { SalesRentTable } from "@/components/sales/sales-rent-table";
import { SalesRentSummaryBar } from "@/components/sales/sales-rent-summary-bar";
import { useSalesRentData } from "@/hooks/use-sales-rent-data";
import { useTableEditing } from "@/hooks/use-table-editing";
import { useExcelExport } from "@/hooks/use-excel-export";
import { api } from "@/lib/api-client";
import type { SalesRentFilter, SalesRentRow } from "@/types/sales-rent";
import type { Store, Employee } from "@/types/master";

function makeEmptyRow(filter: SalesRentFilter, tempId: number): SalesRentRow {
  return {
    id: tempId,
    display_order: 0,
    applied_at: new Date().toISOString().slice(0, 10),
    employee_id: null,
    customer_name: "",
    property_name: "",
    brokerage_fee: 0,
    ad_fee: 0,
    payment_fee: 0,
    total_sales: 0,
    received_at: null,
    is_white_flow: false,
    fee_calculation: 0,
    delivered_at: null,
    is_delivery_flow: false,
    ad_calculation: 0,
    total_summary: 0,
    status_flag: null,
    store_id: filter.store_id,
    closing_month: filter.closing_month,
    category: "",
    is_closed: false,
  };
}

export default function SalesRentEntryPage() {
  const [filter, setFilter] = useState<SalesRentFilter>({
    store_id: 1,
    closing_month: "2026-02",
  });
  const [localNewRows, setLocalNewRows] = useState<SalesRentRow[]>([]);

  const storesQuery = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.get<Store[]>("/api/master/stores"),
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", filter.store_id],
    queryFn: () => api.get<Employee[]>(`/api/master/employees?store_id=${filter.store_id}`),
  });
  const { query, createMutation, batchUpdateMutation, closingMutation } = useSalesRentData(filter);
  const editing = useTableEditing<SalesRentRow>();
  const { exportExcel } = useExcelExport();

  const serverRows = query.data ?? [];
  const allRows = [...serverRows, ...localNewRows];

  const handleSave = async () => {
    const newRowsToSave = localNewRows;
    const editedRows = editing.getEditedRows(serverRows);

    try {
      for (const row of newRowsToSave) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...payload } = row;
        await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0]);
      }
      if (editedRows.length > 0) {
        await batchUpdateMutation.mutateAsync(editedRows.map((r) => ({ ...r })));
      }
      editing.clearDirty();
      setLocalNewRows([]);
      toast.success("保存しました", {
        description: `${editedRows.length + newRowsToSave.length} 件を更新しました`,
      });
    } catch (e) {
      toast.error("保存に失敗しました", { description: String(e) });
    }
  };

  const handleAddRow = () => {
    const tempId = -(Date.now());
    const newRow = makeEmptyRow(filter, tempId);
    setLocalNewRows((prev) => [...prev, newRow]);
    editing.updateCell(tempId, "id", tempId);
  };

  const hasDirty = editing.hasDirty || localNewRows.length > 0;

  return (
    <div className="flex flex-col h-screen">
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <Breadcrumb items={[{ label: "賃貸" }, { label: "売上入力" }]} />
        <span className="text-xs text-slate-400">{new Date().toLocaleString("ja-JP")}</span>
      </div>
      <SalesRentHeader
        stores={storesQuery.data ?? []}
        employees={employeesQuery.data ?? []}
        filter={filter}
        onFilterChange={(partial) => {
          setFilter((prev) => ({ ...prev, ...partial }));
          setLocalNewRows([]);
          editing.clearDirty();
        }}
        onSave={handleSave}
        onAddRow={handleAddRow}
        onExcelExport={() => exportExcel(filter)}
        onClosingProcess={() => closingMutation.mutate({ store_id: filter.store_id, closing_month: filter.closing_month })}
        hasDirty={hasDirty}
        isSaving={batchUpdateMutation.isPending || createMutation.isPending}
      />
      <SalesRentSummaryBar rows={allRows} />
      <div className="flex-1 overflow-auto">
        <SalesRentTable rows={allRows} editing={editing} isLoading={query.isLoading} />
      </div>
    </div>
  );
}
