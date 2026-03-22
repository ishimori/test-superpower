"use client";
import { useState } from "react";

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function EditableDateCell({ value, onChange, disabled }: Props) {
  const [editing, setEditing] = useState(false);

  if (disabled) return <span>{value ?? ""}</span>;

  if (editing) {
    return (
      <input
        type="date"
        defaultValue={value ?? ""}
        className="border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(e) => onChange(e.target.value || null)}
        onBlur={() => setEditing(false)}
        autoFocus
      />
    );
  }

  return (
    <span
      className="block cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 min-h-[1.5rem] text-sm"
      onClick={() => setEditing(true)}
    >
      {value ?? <span className="text-slate-400 text-xs">YYYY/MM/DD</span>}
    </span>
  );
}
