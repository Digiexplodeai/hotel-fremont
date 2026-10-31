"use client";

import React, { createContext, useContext } from "react";
import { SlotData } from "@/lib/data/siteData";

const SiteSlotsContext = createContext<Record<string, SlotData>>({});

export function SiteSlotsProvider({
  slots,
  children,
}: {
  slots: Record<string, SlotData>;
  children: React.ReactNode;
}) {
  return (
    <SiteSlotsContext.Provider value={slots || {}}>
      {children}
    </SiteSlotsContext.Provider>
  );
}

export function useSiteSlots() {
  const context = useContext(SiteSlotsContext) || {};
  return {
    slots: context,
    ...context,
  };
}

export function useSiteSlot(slotKey: string, fallbackUrl?: string) {
  const slots = useContext(SiteSlotsContext);
  const slot = slots?.[slotKey];
  return {
    url: slot?.url || fallbackUrl || "/assets/logo.png",
    altText: slot?.altText || "Hotel Fremont",
    focalPoint: slot?.focalPoint || "50% 50%",
    isCustom: !!slot?.isCustom,
  };
}
