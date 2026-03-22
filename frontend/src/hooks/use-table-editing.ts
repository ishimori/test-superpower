import { useState, useCallback, useMemo } from "react";

interface HasId { id: number; }

export function useTableEditing<T extends HasId>() {
  const [edits, setEdits] = useState<Map<number, Partial<T>>>(new Map());
  const dirtyIds = useMemo(() => new Set(edits.keys()), [edits]);

  const updateCell = useCallback((id: number, field: keyof T, value: unknown) => {
    setEdits((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) ?? {};
      next.set(id, { ...existing, [field]: value });
      return next;
    });
  }, []);

  const getEditedRows = useCallback((originals: T[]): T[] => {
    return originals
      .filter((row) => edits.has(row.id))
      .map((row) => ({ ...row, ...edits.get(row.id) }));
  }, [edits]);

  const clearDirty = useCallback(() => {
    setEdits(new Map());
  }, []);

  const getCellValue = useCallback(<K extends keyof T>(row: T, field: K): T[K] => {
    const edit = edits.get(row.id);
    return edit && field in edit ? (edit[field] as T[K]) : row[field];
  }, [edits]);

  return {
    dirtyIds,
    hasDirty: dirtyIds.size > 0,
    updateCell,
    getEditedRows,
    clearDirty,
    getCellValue,
  };
}
