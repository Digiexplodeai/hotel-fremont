import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getBookingsAction } from "@/actions/rooms";
import { getReservationsAction } from "@/actions/reservations";
import GuestDirectory from "@/components/admin/GuestDirectory";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Guest Directory & Profiles | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminGuestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [bookingsRes, reservationsRes] = await Promise.all([
    getBookingsAction(),
    getReservationsAction(),
  ]);

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Guest Directory & CRM Stays"
      subtitle="Hotel Fremont · Customer stay histories, lifetime spend, preferences, and direct WhatsApp contact"
    >
      <GuestDirectory
        bookings={bookingsRes.bookings || []}
        reservations={reservationsRes.reservations || []}
      />
    </AdminLayoutShell>
  );
}
