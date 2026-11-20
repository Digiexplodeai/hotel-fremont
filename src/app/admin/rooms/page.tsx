import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getRoomsWithStatusAction, getBookingsAction } from "@/actions/rooms";
import { getReservationsAction } from "@/actions/reservations";
import { getRoomTypesAction, getAvailabilityCalendarAction } from "@/actions/roomTypes";
import RoomsManager from "@/components/admin/RoomsManager";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Room Inventory & Rates | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRoomsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [roomsRes, bookingsRes, reservationsRes, roomTypesRes, calendarRes] = await Promise.all([
    getRoomsWithStatusAction(),
    getBookingsAction(),
    getReservationsAction(),
    getRoomTypesAction(),
    getAvailabilityCalendarAction(),
  ]);

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Room Management & Verified 21 Keys"
      subtitle="Hotel Fremont · Deluxe (9), Super Deluxe (10), Premium (2) · 4 Rate Plans"
    >
      <RoomsManager
        initialRooms={roomsRes.rooms}
        initialBookings={bookingsRes.bookings}
        initialReservations={reservationsRes.reservations || []}
        initialRoomTypes={roomTypesRes.roomTypes}
        initialCalendar={calendarRes.calendar || []}
        isDatabase={roomsRes.isDatabase}
      />
    </AdminLayoutShell>
  );
}
