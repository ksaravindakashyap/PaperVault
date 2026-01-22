"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { name: "Library", href: "/library" },
  { name: "Projects", href: "/projects" },
  { name: "Graph", href: "/graph", disabled: true },
  { name: "Manuscripts", href: "/manuscripts", disabled: true },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();

  if (collapsed) {
    return (
      <aside className="h-full bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <div className="mb-4" title="PaperVault">
          <span className="text-lg font-bold text-primary-600">PV</span>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.disabled ? "#" : item.href}
              className="block p-2 text-gray-700 hover:bg-gray-100 rounded-md"
              title={item.name}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
            </Link>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">PaperVault</h1>
      </div>
      <nav className="px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.disabled ? "#" : item.href}
              className={`
                block px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                }
              `}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
