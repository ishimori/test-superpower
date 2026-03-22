export interface SalesRentRow {
  id: number;
  display_order: number;
  applied_at: string | null;       // ISO date string
  employee_id: number | null;
  customer_name: string;
  property_name: string;
  brokerage_fee: number;
  ad_fee: number;
  payment_fee: number;
  total_sales: number;
  received_at: string | null;
  is_white_flow: boolean;
  fee_calculation: number;
  delivered_at: string | null;
  is_delivery_flow: boolean;
  ad_calculation: number;
  total_summary: number;
  status_flag: string | null;
  store_id: number;
  closing_month: string;
  category: string;
  is_closed: boolean;
}

export interface SalesRentFilter {
  store_id: number;
  closing_month: string;
  employee_id?: number;
  category?: string;
}

export interface SalesRentCreatePayload {
  store_id: number;
  closing_month: string;
  applied_at?: string | null;
  employee_id?: number | null;
  customer_name?: string;
  property_name?: string;
  brokerage_fee?: number;
  ad_fee?: number;
  payment_fee?: number;
}

export interface SalesRentUpdatePayload {
  id: number;
  [key: string]: unknown;
}
