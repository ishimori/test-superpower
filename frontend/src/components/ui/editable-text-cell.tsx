"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function EditableTextCell({ value, onChange, disabled, className }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  if (disabled) return <span className={className}>{value}</span>;

  if (editing) {
    return (
      <input
        ref={ref}
        value={input}
        className="w-full border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => { onChange(input); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(input); setEditing(false); } }}
      />
    );
  }

  return (
    <span
      className={`block cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 min-h-[1.5rem] ${className ?? ""}`}
      onClick={() => { setInput(value); setEditing(true); }}
    >
      {value || <span className="text-slate-400 text-xs">クリックして編集</span>}
    </span>
  );
}
