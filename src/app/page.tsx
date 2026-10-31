import { getImageSlotsMap } from "@/lib/data/siteData";
import { SiteSlotsProvider } from "@/context/SiteSlotsContext";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const slotsMap = await getImageSlotsMap();

  return (
    <SiteSlotsProvider slots={slotsMap}>
      <HomeClient />
    </SiteSlotsProvider>
  );
}
