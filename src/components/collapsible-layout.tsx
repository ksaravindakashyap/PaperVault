"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AgenticSearchDialog } from "@/components/agentic-search-dialog";
import { getSidebarPrefs, setSidebarPrefs } from "@/lib/ui/sidebarPrefs";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface CollapsibleLayoutProps {
  children: React.ReactNode;
}

export function CollapsibleLayout({ children }: CollapsibleLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const prefs = getSidebarPrefs();
    setSidebarCollapsed(prefs.collapsed);
  }, []);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Save collapsed state
  useEffect(() => {
    setSidebarPrefs({ collapsed: sidebarCollapsed });
  }, [sidebarCollapsed]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Mobile layout: Sheet sidebar
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="p-2 hover:bg-gray-100 rounded"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-gray-900">PaperVault</h1>
        </div>
        <Header onToggleSidebar={handleToggleSidebar} sidebarCollapsed={false} />
        <main className="flex-1 overflow-auto">{children}</main>
      <AgenticSearchDialog showTrigger={false} />
      </div>
    );
  }

  // Desktop layout: Fixed-width sidebar with collapse/expand
  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`h-full transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>
      
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header
          onToggleSidebar={handleToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      {/* Global AI search dialog — triggered by header search bar from any page */}
      <AgenticSearchDialog showTrigger={false} />
    </div>
  );
}
