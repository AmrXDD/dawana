import type { Metadata } from "next";
import Shell from "@/components/admin/Shell";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Control room",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let email: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return <Shell email={email}>{children}</Shell>;
}
