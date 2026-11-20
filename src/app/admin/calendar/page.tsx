import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getAvailabilityCalendarAction } from "@/actions/roomTypes";
import RoomCalendar from "@/components/admin/RoomCalendar";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Room Calendar & Availability Matrix | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCalendarPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const calendarRes = await getAvailabilityCalendarAction();

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Room Calendar & 28-Day Availability Matrix"
      subtitle="Hotel Fremont · 21 Verified Keys · Real-time occupancy & arrival rosters"
    >
      <RoomCalendar initialCalendar={calendarRes.calendar || []} />
    </AdminLayoutShell>
  );
}
