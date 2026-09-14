import type { Metadata } from "next";
import Shell from "@/components/admin/Shell";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Control room",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  return <Shell admin={admin}>{children}</Shell>;
}
