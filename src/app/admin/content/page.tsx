import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import {
  getSiteSettingsAction,
  getFacilitiesAction,
  getVenuesAction,
  getNearbyPlacesAction,
} from "@/actions/content";
import ContentManager from "@/components/admin/ContentManager";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Website CMS & Global Settings | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminContentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [settingsRes, facilitiesRes, venuesRes, nearbyRes] = await Promise.all([
    getSiteSettingsAction(),
    getFacilitiesAction(true),
    getVenuesAction(true),
    getNearbyPlacesAction(true),
  ]);

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Website CMS & Global Settings"
      subtitle="Hotel Fremont · Configure official phone numbers, WhatsApp, timings, facilities, venues, and nearby attractions"
    >
      <ContentManager
        initialSettings={settingsRes.settings}
        initialFacilities={facilitiesRes.facilities}
        initialVenues={venuesRes.venues}
        initialNearbyPlaces={nearbyRes.places}
        isDatabase={settingsRes.isDatabase}
      />
    </AdminLayoutShell>
  );
}
