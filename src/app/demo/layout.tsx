"use client";

import { DemoProvider } from "@/demo/demo-provider";
import { DemoBanner } from "@/components/demo-banner";
import { CollapsibleLayout } from "@/components/collapsible-layout";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <div className="flex flex-col h-screen">
        <DemoBanner />
        <div className="flex-1 min-h-0">
          <CollapsibleLayout>
            {children}
          </CollapsibleLayout>
        </div>
      </div>
    </DemoProvider>
  );
}
