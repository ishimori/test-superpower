import { render, screen, fireEvent } from "@testing-library/react";
import { SalesRentHeader } from "@/components/sales/sales-rent-header";

const mockStores = [{ id: 1, name: "本店" }, { id: 2, name: "支店" }];
const defaultProps = {
  stores: mockStores,
  employees: [],
  filter: { store_id: 1, closing_month: "2026-02" },
  onFilterChange: vi.fn(),
  onSave: vi.fn(),
  onAddRow: vi.fn(),
  onExcelExport: vi.fn(),
  onClosingProcess: vi.fn(),
  hasDirty: false,
  isSaving: false,
};

test("renders filter controls and action buttons", () => {
  render(<SalesRentHeader {...defaultProps} />);
  expect(screen.getByText("保存")).toBeInTheDocument();
  expect(screen.getByText("行を追加")).toBeInTheDocument();
  expect(screen.getByText("Excel")).toBeInTheDocument();
  expect(screen.getByText("締め処理")).toBeInTheDocument();
});

test("save button is disabled when no dirty rows", () => {
  render(<SalesRentHeader {...defaultProps} hasDirty={false} />);
  expect(screen.getByText("保存").closest("button")).toBeDisabled();
});

test("save button is enabled when dirty rows exist", () => {
  render(<SalesRentHeader {...defaultProps} hasDirty={true} />);
  expect(screen.getByText("保存").closest("button")).not.toBeDisabled();
});

test("clicking add row calls onAddRow", () => {
  render(<SalesRentHeader {...defaultProps} />);
  fireEvent.click(screen.getByText("行を追加"));
  expect(defaultProps.onAddRow).toHaveBeenCalled();
});
