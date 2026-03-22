import { renderHook, act } from "@testing-library/react";
import { useTableEditing } from "@/hooks/use-table-editing";

interface Row { id: number; name: string; value: number; }

test("initially no dirty rows", () => {
  const { result } = renderHook(() => useTableEditing<Row>());
  expect(result.current.dirtyIds.size).toBe(0);
  expect(result.current.hasDirty).toBe(false);
});

test("updateCell marks row as dirty", () => {
  const { result } = renderHook(() => useTableEditing<Row>());
  act(() => { result.current.updateCell(1, "name", "新しい名前"); });
  expect(result.current.dirtyIds.has(1)).toBe(true);
  expect(result.current.hasDirty).toBe(true);
});

test("getEditedRows returns only dirty rows merged with original", () => {
  const originals: Row[] = [
    { id: 1, name: "元の名前", value: 100 },
    { id: 2, name: "変更なし", value: 200 },
  ];
  const { result } = renderHook(() => useTableEditing<Row>());
  act(() => { result.current.updateCell(1, "name", "新しい名前"); });
  const edited = result.current.getEditedRows(originals);
  expect(edited).toHaveLength(1);
  expect(edited[0]).toEqual({ id: 1, name: "新しい名前", value: 100 });
});

test("clearDirty resets state", () => {
  const { result } = renderHook(() => useTableEditing<Row>());
  act(() => { result.current.updateCell(1, "name", "新しい名前"); });
  act(() => { result.current.clearDirty(); });
  expect(result.current.hasDirty).toBe(false);
});
