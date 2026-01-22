/**
 * Sidebar preferences management (localStorage)
 */

export interface SidebarPrefs {
  collapsed: boolean;
}

const STORAGE_KEY = "papervault_sidebar_prefs";

const DEFAULT_PREFS: SidebarPrefs = {
  collapsed: false,
};

export function getSidebarPrefs(): SidebarPrefs {
  if (typeof window === "undefined") {
    return DEFAULT_PREFS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        collapsed: typeof parsed.collapsed === "boolean" ? parsed.collapsed : DEFAULT_PREFS.collapsed,
      };
    }
  } catch (error) {
    console.error("Failed to load sidebar prefs:", error);
  }

  return DEFAULT_PREFS;
}

export function setSidebarPrefs(prefs: Partial<SidebarPrefs>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = getSidebarPrefs();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save sidebar prefs:", error);
  }
}
