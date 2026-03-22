"use client";
import { Button } from "@/components/ui/button";
import { Download, Lock, Save, Plus } from "lucide-react";
import type { Store, Employee } from "@/types/master";
import type { SalesRentFilter } from "@/types/sales-rent";

interface Props {
  stores: Store[];
  employees: Employee[];
  filter: SalesRentFilter;
  onFilterChange: (filter: Partial<SalesRentFilter>) => void;
  onSave: () => void;
  onAddRow: () => void;
  onExcelExport: () => void;
  onClosingProcess: () => void;
  hasDirty: boolean;
  isSaving: boolean;
}

const CLOSING_MONTHS = Array.from({ length: 12 }, (_, i) => {
  return {
    value: `2026-${String(i + 1).padStart(2, "0")}`,
    label: `2026年${i + 1}月(未)`,
  };
});

const CATEGORIES = ["全件", "仲介", "自社"];

export function SalesRentHeader({ stores, employees, filter, onFilterChange, onSave, onAddRow, onExcelExport, onClosingProcess, hasDirty, isSaving }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm text-slate-500">店舗</label>
        <select
          value={filter.store_id}
          onChange={(e) => onFilterChange({ store_id: Number(e.target.value) })}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label className="text-sm text-slate-500 ml-2">締め月</label>
        <select
          value={filter.closing_month}
          onChange={(e) => onFilterChange({ closing_month: e.target.value })}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {CLOSING_MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <label className="text-sm text-slate-500 ml-2">社員名</label>
        <select
          value={filter.employee_id ?? ""}
          onChange={(e) => onFilterChange({ employee_id: e.target.value ? Number(e.target.value) : undefined })}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全員</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>

        <label className="text-sm text-slate-500 ml-2">区分</label>
        <select
          value={filter.category ?? ""}
          onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {CATEGORIES.map((c) => <option key={c} value={c === "全件" ? "" : c}>{c}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExcelExport}>
          <Download size={14} className="mr-1" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={onClosingProcess}>
          <Lock size={14} className="mr-1" /> 締め処理
        </Button>
        <Button size="sm" onClick={onSave} disabled={!hasDirty || isSaving}>
          <Save size={14} className="mr-1" /> {isSaving ? "保存中..." : "保存"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onAddRow}>
          <Plus size={14} className="mr-1" /> 行を追加
        </Button>
      </div>
    </div>
  );
}
