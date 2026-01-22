"use client";

import Link from "next/link";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function DemoBanner() {
  const router = useRouter();

  const handleExitDemo = () => {
    router.push("/");
  };

  return (
    <div className="bg-orange-500 text-white px-4 py-3 border-b border-orange-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium">Demo mode</span>
          <span className="text-orange-100 text-sm">•</span>
          <span className="text-orange-100 text-sm">Read-only</span>
          <span className="text-orange-100 text-sm">•</span>
          <span className="text-orange-100 text-sm">Data resets</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/download">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Software
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitDemo}
            className="text-white hover:bg-white/10"
          >
            <X className="w-4 h-4 mr-2" />
            Exit Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
