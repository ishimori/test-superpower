"use client";

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  danger?: boolean;
}

export function EditableCheckboxCell({ value, onChange, disabled, danger }: Props) {
  return (
    <input
      type="checkbox"
      checked={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className={`h-4 w-4 cursor-pointer ${danger ? "accent-red-600" : "accent-slate-700"}`}
    />
  );
}
