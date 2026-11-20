import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getBookingsAction } from "@/actions/rooms";
import { getReservationsAction } from "@/actions/reservations";
import PaymentsLedger from "@/components/admin/PaymentsLedger";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Payments Ledger & Transactions | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPaymentsPage() {
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
      title="Payments Ledger & Razorpay Transactions"
      subtitle="Hotel Fremont · Online room booking payments, transaction IDs, payment methods, and revenue settlement"
    >
      <PaymentsLedger
        bookings={bookingsRes.bookings || []}
        reservations={reservationsRes.reservations || []}
      />
    </AdminLayoutShell>
  );
}
