import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getRoomsWithStatusAction } from "@/actions/rooms";
import SystemHealth from "@/components/admin/SystemHealth";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "System Health & Technical Diagnostics | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminHealthPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const roomsRes = await getRoomsWithStatusAction();

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="System Health & Infrastructure Diagnostics"
      subtitle="Hotel Fremont · Cloudflare R2, Supabase PostgreSQL, Razorpay Webhook, and Edge network health"
    >
      <SystemHealth initialDbStatus={roomsRes.isDatabase} />
    </AdminLayoutShell>
  );
}
