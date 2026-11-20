import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getBookingsAction } from "@/actions/rooms";
import { getReservationsAction } from "@/actions/reservations";
import ReservationsManager from "@/components/admin/ReservationsManager";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Reservations Management | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminReservationsPage() {
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
      title="Reservations & Guest Bookings"
      subtitle="Hotel Fremont · Online full-payment bookings & front-desk reservations ledger"
    >
      <ReservationsManager
        initialBookings={bookingsRes.bookings}
        initialReservations={reservationsRes.reservations || []}
      />
    </AdminLayoutShell>
  );
}
