import { useCallback } from "react";
import type { SalesRentFilter } from "@/types/sales-rent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useExcelExport() {
  const exportExcel = useCallback(async (filter: SalesRentFilter) => {
    const params = new URLSearchParams({
      store_id: String(filter.store_id),
      closing_month: filter.closing_month,
      ...(filter.employee_id ? { employee_id: String(filter.employee_id) } : {}),
      ...(filter.category ? { category: filter.category } : {}),
    });
    const url = `${API_BASE}/api/sales/rent/export/excel?${params}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_rent_${filter.closing_month}.xlsx`;
    a.click();
  }, []);

  return { exportExcel };
}
