import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import ImageManager from "@/components/admin/ImageManager";
import { getImageSlotsMap } from "@/lib/data/siteData";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Media Library & R2 Asset Vault | Hotel Fremont Admin",
  description: "Manage, crop, replace, and reorder all website imagery on Cloudflare R2",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminImagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const initialSlotsMap = await getImageSlotsMap();

  return (
    <AdminLayoutShell
      userEmail={user.email}
      title="Media Library & Cloudflare R2 Vault"
      subtitle="Hotel Fremont · Replace, crop, focal-align, and reorder photography across all website sections with direct-to-R2 presigned uploads"
    >
      <ImageManager initialSlotsMap={initialSlotsMap} />
    </AdminLayoutShell>
  );
}
