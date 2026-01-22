import type { Metadata } from "next";
import { Gowun_Batang } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserInitProvider } from "@/components/user-init-provider";

const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PaperVault - Research Lab Workspace",
  description: "Paper-centric research workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={gowunBatang.className} suppressHydrationWarning>
        <UserInitProvider>{children}</UserInitProvider>
        <Toaster />
      </body>
    </html>
  );
}
