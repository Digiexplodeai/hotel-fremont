import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getEnquiriesAction } from "@/actions/enquiries";
import EnquiriesManager from "@/components/admin/EnquiriesManager";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Enquiry CRM & Leads | Hotel Fremont Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminEnquiriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const enquiriesRes = await getEnquiriesAction();

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Guest Enquiries & CRM Inbox"
      subtitle="Hotel Fremont · Manage room booking leads, banquet requests, dining hall reservations"
    >
      <EnquiriesManager
        initialEnquiries={enquiriesRes.enquiries}
        isDatabase={enquiriesRes.isDatabase}
      />
    </AdminLayoutShell>
  );
}
