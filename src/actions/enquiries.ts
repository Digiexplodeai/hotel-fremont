"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EnquiryType = "rate_check" | "book_now" | "dining_aura" | "event_banquet" | "contact";
export type EnquiryStatus = "new" | "contacted" | "converted" | "closed";

export interface EnquiryRecord {
  id: string;
  type: EnquiryType;
  name: string;
  phone: string;
  email?: string;
  dates?: string;
  guests?: number;
  details?: Record<string, any>;
  status: EnquiryStatus;
  notes?: string;
  createdAt: string;
}

// Fallback in-memory state
let memoryEnquiries: EnquiryRecord[] = [
  {
    id: "enq-1",
    type: "book_now",
    name: "Vikram Malhotra",
    phone: "+91 98111 22334",
    email: "vikram.m@example.com",
    dates: "2026-10-29 to 2026-10-31",
    guests: 2,
    details: { suite: "Deluxe King Room", totalAmount: 12978 },
    status: "converted",
    notes: "Booking confirmed (HF-20261030-01)",
    createdAt: "2026-10-27T09:45:00Z",
  },
  {
    id: "enq-2",
    type: "event_banquet",
    name: "Meenakshi Sethi",
    phone: "+91 98722 45678",
    email: "meenakshi@sethienterprises.com",
    dates: "2026-11-15",
    guests: 60,
    details: { eventType: "Corporate Cocktail & Gala", venue: "The Grand Pavilion" },
    status: "new",
    notes: "Requires AV projector, custom cocktail menu, and stage setup.",
    createdAt: "2026-10-30T08:15:00Z",
  },
  {
    id: "enq-3",
    type: "dining_aura",
    name: "Dr. Kabir Oberoi",
    phone: "+91 98140 99887",
    email: "kabir.oberoi@apollo.org",
    dates: "2026-10-31 at 8:30 PM",
    guests: 4,
    details: { mealType: "Dinner", area: "Private Dining Alcove" },
    status: "contacted",
    notes: "Called on WhatsApp. Table reserved for family dinner.",
    createdAt: "2026-10-29T18:20:00Z",
  },
  {
    id: "enq-4",
    type: "rate_check",
    name: "Jaspreet Kaur",
    phone: "+91 98888 12345",
    email: "jaspreet.k@gmail.com",
    dates: "2026-11-10 to 2026-11-12",
    guests: 2,
    details: { suite: "The Royal Fremont Suite" },
    status: "new",
    notes: "Inquired about airport drop and complimentary breakfast inclusions.",
    createdAt: "2026-10-30T10:30:00Z",
  },
];

export interface SubmitEnquiryInput {
  type: EnquiryType;
  name: string;
  phone: string;
  email?: string;
  dates?: string;
  guests?: number;
  details?: Record<string, any>;
  notes?: string;
}

/**
 * Public Server Action to capture leads from modals/forms
 */
export async function submitPublicEnquiryAction(input: SubmitEnquiryInput): Promise<{
  success: boolean;
  enquiryId?: string;
  error?: string;
}> {
  try {
    if (!input.name?.trim() || !input.phone?.trim()) {
      return { success: false, error: "Name and contact number are required." };
    }

    const newEnquiry: EnquiryRecord = {
      id: `enq-${Date.now()}`,
      type: input.type,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      dates: input.dates || undefined,
      guests: input.guests || undefined,
      details: input.details || {},
      status: "new",
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Store in memory
    memoryEnquiries = [newEnquiry, ...memoryEnquiries];

    // Store in Supabase if online
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase.from("enquiries").insert({
        type: input.type,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        dates: input.dates || null,
        guests: input.guests || null,
        details: input.details || {},
        status: "new",
        notes: input.notes?.trim() || null,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/enquiries");
    return { success: true, enquiryId: newEnquiry.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record inquiry";
    console.warn("Public inquiry capture error:", err);
    // Still return success if memory recorded so UX is never blocked
    return { success: true };
  }
}

/**
 * Fetch all enquiries with status
 */
export async function getEnquiriesAction(): Promise<{
  success: boolean;
  enquiries: EnquiryRecord[];
  isDatabase: boolean;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: true, enquiries: memoryEnquiries, isDatabase: false };
    }

    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return { success: true, enquiries: memoryEnquiries, isDatabase: false };
    }

    const enquiries: EnquiryRecord[] = data.map((e) => ({
      id: e.id,
      type: e.type as EnquiryType,
      name: e.name,
      phone: e.phone,
      email: e.email || undefined,
      dates: e.dates || undefined,
      guests: e.guests || undefined,
      details: e.details || {},
      status: e.status as EnquiryStatus,
      notes: e.notes || undefined,
      createdAt: e.created_at,
    }));

    return { success: true, enquiries, isDatabase: true };
  } catch {
    return { success: true, enquiries: memoryEnquiries, isDatabase: false };
  }
}

/**
 * Update enquiry status and staff notes
 */
export async function updateEnquiryStatusAction(
  enquiryId: string,
  status: EnquiryStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    memoryEnquiries = memoryEnquiries.map((e) => {
      if (e.id === enquiryId) {
        return {
          ...e,
          status,
          notes: notes !== undefined ? notes : e.notes,
        };
      }
      return e;
    });

    const supabase = await createServerSupabaseClient();
    if (supabase) {
      await supabase
        .from("enquiries")
        .update({
          status,
          notes: notes !== undefined ? notes : undefined,
        })
        .eq("id", enquiryId);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/enquiries");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update enquiry";
    return { success: false, error: message };
  }
}

