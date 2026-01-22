"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({ onToggleSidebar, sidebarCollapsed = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  // Sync search query from URL when on search page
  useEffect(() => {
    if (pathname === "/search") {
      const urlQuery = searchParams.get("q") || "";
      setSearchQuery(urlQuery);
    }
  }, [pathname, searchParams]);

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
      if (trimmed) {
        if (pathname === "/search") {
          // Already on search page, update query
          router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
        } else {
          // Navigate to search page
          router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        }
      } else {
        // Empty query, just go to search page
        router.push("/search");
      }
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
        <div className="flex items-center gap-3">
          <WorkspaceSwitcher />
          {workspaceName && (
            <h2 className="text-lg font-semibold text-gray-800">
              {workspaceName} Workspace
            </h2>
          )}
        </div>
      </div>
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search..."
            className="pl-9 pr-4"
          />
        </div>
      </div>
    </header>
  );
}
