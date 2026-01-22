"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { UserInitDialog } from "./user-init-dialog";

export function UserInitProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Skip initialization for demo routes, marketing routes, and static assets
    if (
      pathname.startsWith("/demo") ||
      pathname === "/" ||
      pathname === "/about" ||
      pathname === "/download"
    ) {
      setIsChecking(false);
      return;
    }

    // Only check once per mount
    if (hasCheckedRef.current) return;
    
    const checkUser = async () => {
      try {
        const response = await fetch("/api/me");
        const data = await response.json();
        
        // API returns { user: { id, name } } if user exists, or { user: null } if not
        if (!data.user) {
          setShowDialog(true);
        }
      } catch (error) {
        console.error("Failed to check user:", error);
        // On error, show dialog to allow user to set name
        setShowDialog(true);
      } finally {
        setIsChecking(false);
        hasCheckedRef.current = true;
      }
    };

    checkUser();
  }, [pathname]);

  if (isChecking) {
    return null; // Or a loading spinner
  }

  const handleDialogClose = () => {
    setShowDialog(false);
  };

  return (
    <>
      {children}
      <UserInitDialog open={showDialog} onClose={handleDialogClose} />
    </>
  );
}
