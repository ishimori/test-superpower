"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Clock, Calendar, Building, ChevronDown } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "ダッシュボード", href: "/", icon: Home },
  { label: "動態", href: "/activity", icon: Clock },
  { label: "有休", href: "/leave", icon: Calendar },
  {
    label: "賃貸", icon: Building, children: [
      { label: "売上入力", href: "/sales/rent/entry" },
      { label: "個人別", href: "/sales/rent/individual" },
      { label: "申込日別", href: "/sales/rent/by-date" },
      { label: "入金日別", href: "/sales/rent/by-payment" },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["賃貸"]));

  return (
    <aside className="w-56 min-h-screen bg-slate-800 text-slate-200 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-700">
        <h1 className="text-sm font-bold text-white">Housing E-Kintai</h1>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          if ("children" in item) {
            const isOpen = openSections.has(item.label);
            const children = item.children ?? [];
            return (
              <div key={item.label}>
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 text-slate-300"
                  onClick={() => setOpenSections((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.label)) next.delete(item.label);
                    else next.add(item.label);
                    return next;
                  })}
                >
                  <item.icon size={16} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="bg-slate-900">
                    {children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block pl-10 pr-4 py-2 text-sm",
                          pathname === child.href
                            ? "bg-blue-600 text-white font-medium"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm",
                pathname === item.href ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
        <p>管理者（総務部）</p>
        <button className="mt-1 hover:text-white">ログアウト</button>
      </div>
    </aside>
  );
}
