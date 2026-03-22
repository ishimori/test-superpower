// status_flag の値とスタイルのマッピング
// 業務ルール確認後に追記すること
const STATUS_STYLE_MAP: Record<string, string> = {
  // 例: "cancelled": "bg-red-50",
  // 例: "settled": "bg-blue-50",
};

export function resolveRowClass(statusFlag: string | null): string {
  if (!statusFlag) return "";
  return STATUS_STYLE_MAP[statusFlag] ?? "";
}

export function resolveNumberClass(value: number): string {
  return value < 0 ? "text-red-600" : "";
}
