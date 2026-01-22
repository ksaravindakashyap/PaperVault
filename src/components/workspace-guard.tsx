"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

export function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip guard for onboarding page
    if (pathname === "/onboarding") {
      setIsChecking(false);
      return;
    }

    // Check if user has active workspace
    fetch("/api/me/workspace")
      .then((res) => res.json())
      .then((data) => {
        if (!data.hasWorkspace) {
          router.push("/onboarding");
        } else {
          setIsChecking(false);
        }
      })
      .catch((error) => {
        console.error("Failed to check workspace:", error);
        // On error, allow through (don't block user)
        setIsChecking(false);
      });
  }, [pathname, router]);

  if (isChecking && pathname !== "/onboarding") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
