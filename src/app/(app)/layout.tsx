import { CollapsibleLayout } from "@/components/collapsible-layout";
import { UserInitProvider } from "@/components/user-init-provider";
import { WorkspaceGuard } from "@/components/workspace-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserInitProvider>
      <WorkspaceGuard>
        <CollapsibleLayout>{children}</CollapsibleLayout>
      </WorkspaceGuard>
    </UserInitProvider>
  );
}
