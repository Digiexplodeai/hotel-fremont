import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getRoomTypesAction } from "@/actions/roomTypes";
import RatesManager from "@/components/admin/RatesManager";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Rates & Meal Plans | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const roomTypesRes = await getRoomTypesAction(false);

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Room Rates & Meal Plans"
      subtitle="Hotel Fremont · Deluxe, Super Deluxe, Premium · Single/Double Occupancy · EP & CP Plans · 5% GST (Tariff up to ₹7,500/night)"
    >
      <RatesManager initialRoomTypes={roomTypesRes.roomTypes || []} />
    </AdminLayoutShell>
  );
}
