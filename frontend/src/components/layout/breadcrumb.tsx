interface Props {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav className="text-sm text-slate-500 flex items-center gap-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300">›</span>}
          <span className={i === items.length - 1 ? "text-slate-800 font-medium" : ""}>{item.label}</span>
        </span>
      ))}
    </nav>
  );
}
