import { CollapsibleLayout } from "@/components/collapsible-layout";
import { UserInitProvider } from "@/components/user-init-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserInitProvider>
      <CollapsibleLayout>{children}</CollapsibleLayout>
    </UserInitProvider>
  );
}
