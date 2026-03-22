"use client";
import { useState, useRef, useEffect } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { resolveNumberClass as resolveNum } from "./row-color-resolver";

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function EditableNumberCell({ value, onChange, disabled }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setInput(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  if (disabled) {
    return <span className={cn("block text-right tabular-nums", resolveNum(value))}>{formatCurrency(value)}</span>;
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        value={input}
        className="w-full text-right border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => { onChange(parseInt(input, 10) || 0); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(parseInt(input, 10) || 0);
            setEditing(false);
            e.preventDefault();
          }
          if (e.key === "Tab") {
            onChange(parseInt(input, 10) || 0);
            setEditing(false);
            // Let Tab propagate for table-level focus management
          }
        }}
      />
    );
  }

  return (
    <span
      className={cn("block text-right tabular-nums cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5", resolveNum(value))}
      onClick={() => { setInput(String(value)); setEditing(true); }}
    >
      {formatCurrency(value)}
    </span>
  );
}
