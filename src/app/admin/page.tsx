import { Metadata } from "next";
import MediaManager from "@/components/admin/MediaManager";

export const metadata: Metadata = {
  title: "Media Vault | Hotel Fremont Administration",
  description: "Cloudflare R2 Object Storage Media Manager for Hotel Fremont",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <MediaManager />;
}

