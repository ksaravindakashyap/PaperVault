"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({ onToggleSidebar, sidebarCollapsed = false }: HeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  // Load current workspace name
  const loadWorkspaceName = () => {
    fetch("/api/workspaces/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.workspace) {
          setWorkspaceName(data.workspace.name);
        } else {
          setWorkspaceName(null);
        }
      })
      .catch((error) => {
        console.error("Failed to load workspace:", error);
        setWorkspaceName(null);
      });
  };

  useEffect(() => {
    // Don't load workspace name in demo mode
    if (pathname.startsWith("/demo")) {
      setWorkspaceName(null);
      return;
    }
    
    loadWorkspaceName();
    
    // Listen for workspace changes
    const handleWorkspaceChange = () => {
      loadWorkspaceName();
    };
    
    window.addEventListener("workspaceChanged", handleWorkspaceChange);
    return () => {
      window.removeEventListener("workspaceChanged", handleWorkspaceChange);
    };
  }, [pathname]); // Reload when pathname changes (workspace might have switched)

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      window.dispatchEvent(
        new CustomEvent("openAISearch", { detail: { query: trimmed } })
      );
      setSearchQuery("");
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 flex items-center px-6 bg-white">
      <div className="flex-1 flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1 hover:bg-gray-100 rounded hidden lg:block"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {sidebarCollapsed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              )}
            </svg>
          </button>
        )}
        {workspaceName && (
          <h2 className="text-lg font-semibold text-gray-800">
            {workspaceName}
          </h2>
        )}
      </div>
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search papers, ask anything… (Enter)"
            className="pl-9 pr-4"
          />
        </div>
      </div>
    </header>
  );
}
