import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { SalesRentRow, SalesRentFilter, SalesRentCreatePayload, SalesRentUpdatePayload } from "@/types/sales-rent";

export function useSalesRentData(filter: SalesRentFilter | null) {
  const queryClient = useQueryClient();
  const queryKey = ["sales-rent", filter];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!filter) return [];
      const params = new URLSearchParams({
        store_id: String(filter.store_id),
        closing_month: filter.closing_month,
        ...(filter.employee_id ? { employee_id: String(filter.employee_id) } : {}),
        ...(filter.category ? { category: filter.category } : {}),
      });
      return api.get<SalesRentRow[]>(`/api/sales/rent?${params}`);
    },
    enabled: !!filter,
  });

  const createMutation = useMutation({
    mutationFn: (payload: SalesRentCreatePayload) =>
      api.post<SalesRentRow>("/api/sales/rent", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const batchUpdateMutation = useMutation({
    mutationFn: (rows: SalesRentUpdatePayload[]) =>
      api.patch<SalesRentRow[]>("/api/sales/rent/batch", { rows }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const closingMutation = useMutation({
    mutationFn: (payload: { store_id: number; closing_month: string }) =>
      api.post<{ closed_count: number }>("/api/sales/rent/closing", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { query, createMutation, batchUpdateMutation, closingMutation };
}
