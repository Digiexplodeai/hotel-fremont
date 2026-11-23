/**
 * Hotel Fremont - Enquiry Text Formatting and Sanitization Utilities
 * Client and Server compatible utility functions
 */

/**
 * Formats ISO or YYYY-MM-DD dates to human-friendly format (e.g. "2026-11-28" -> "28 Nov 2026")
 * Immune to client/server timezone offset shifts by using explicit calendar component parsing.
 */
export function formatEnquiryDate(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const trimmed = dateStr.trim();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Range: YYYY-MM-DD to YYYY-MM-DD
  if (trimmed.includes(" to ")) {
    const parts = trimmed.split(" to ");
    if (parts[0] && parts[1]) {
      return `${formatEnquiryDate(parts[0])} – ${formatEnquiryDate(parts[1])}`;
    }
  }

  // Match: YYYY-MM-DD at HH:mm
  const atMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+at\s+(.+))?$/i);
  if (atMatch) {
    const y = atMatch[1];
    const m = months[parseInt(atMatch[2], 10) - 1];
    const d = parseInt(atMatch[3], 10);
    const timePart = atMatch[4] ? ` at ${formatEventTime(atMatch[4].trim())}` : "";
    if (m) return `${d} ${m} ${y}${timePart}`;
  }

  // Match: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = months[parseInt(isoMatch[2], 10) - 1];
    const d = parseInt(isoMatch[3], 10);
    if (m) return `${d} ${m} ${y}`;
  }

  return trimmed;
}

/**
 * Formats time string (e.g. "19:30" or "19:30:00" -> "7:30 PM")
 */
export function formatEventTime(timeStr?: string): string {
  if (!timeStr || typeof timeStr !== "string") return "";
  const trimmed = timeStr.trim();
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const m = match24[2];
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${period}`;
  }
  return trimmed;
}

/**
 * Formats ISO timestamptz string (from created_at) to Asia/Kolkata timezone
 * e.g. "2026-11-23T07:26:50.990319+00:00" -> "23 Nov 2026, 12:56 PM"
 */
export function formatReceivedTimestamp(isoStr?: string): string {
  if (!isoStr || typeof isoStr !== "string") return "";
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;
    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(date);

    const day = parts.find((p) => p.type === "day")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const year = parts.find((p) => p.type === "year")?.value;
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value?.toUpperCase();

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
  } catch {
    return isoStr;
  }
}

/**
 * Normalizes guest range labels from dropdown options (preserving "Up to 50 Guests", "50–100 Guests", "100–150 Guests")
 */
export function normalizeGuestRange(raw?: string | number): string {
  if (!raw) return "Up to 50 Guests";
  const str = String(raw).trim();
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    if (num <= 50) return "Up to 50 Guests";
    if (num <= 100) return "50–100 Guests";
    if (num <= 150) return "100–150 Guests";
    return `${num} Guests`;
  }
  let cleaned = str
    .replace(/guests?\s*guests?/gi, "Guests")
    .replace(/^~+\s*/, "")
    .replace(/\s*-\s*/g, "–")
    .replace(/\s+/g, " ")
    .trim();

  if (!/guests?$/i.test(cleaned)) {
    cleaned += " Guests";
  }
  return cleaned;
}

/**
 * Standardizes and cleans enquiry descriptions:
 * - Eliminates duplicate words like "Guests guests"
 * - Removes unnecessary "~" prefix before guest counts
 * - Removes duplicate date text so Event Date and Received On are separate labeled fields
 *   e.g. "Other Event · 100–150 Guests · Cloud 6 Banquet"
 * - Fixes duplicate dining descriptions ("Seating: Main Dining Hall · Seating: Main Dining Hall")
 * - Preserves already saved enquiry data and internal staff follow-up notes
 */
export function cleanEnquiryNotes(rawNotes?: string): string {
  if (!rawNotes || typeof rawNotes !== "string") return "";

  const lines = rawNotes.split("\n");
  let primary = lines[0].trim();
  const staffNotes = lines.slice(1).join("\n").trim();

  // 1. Detect Event / Banquet legacy or uncleaned patterns:
  // e.g. "Birthday / Anniversary in Cloud 6 Banquet for ~50-100 Guests guests on 2026-11-28 · Event: Birthday / Anniversary · Venue: Cloud 6 Banquet"
  const eventRegex = /^(.*?)\s+in\s+(Cloud 6 Banquet|Conference Hall|Banquet)\s+for\s+~?(?:(?:up to\s*)?\d+(?:[–-]\d+)?\s*guests?)\s*(?:guests?)?\s+on\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]+\s+\d{4})(.*)$/i;
  const eventMatch = primary.match(eventRegex);
  if (eventMatch) {
    const occasion = eventMatch[1].replace(/^(event:\s*)/i, "").trim();
    const venue = eventMatch[2].trim();
    const guestRangeMatch = primary.match(/(Up to 50 Guests|50[–-]100 Guests|100[–-]150 Guests|\d+[–-]\d+\s*Guests?|\d+\s*Guests?)/i);
    let guestRange = guestRangeMatch ? guestRangeMatch[1].replace(/\s*-\s*/g, "–").replace(/guests?\s*guests?/i, "Guests") : "50–100 Guests";
    if (!/guests?$/i.test(guestRange)) guestRange += " Guests";

    let customNotes = "";
    const remainder = eventMatch[4] || "";
    const customMatch = remainder.match(/·\s*(?:Notes|Special|Requests?):\s*(.+)$/i);
    if (customMatch) {
      customNotes = ` · Notes: ${customMatch[1].trim()}`;
    }

    primary = `${occasion} · ${guestRange} · ${venue}${customNotes}`;
  } else {
    // Check if in 4-part format: "Occasion · Guest Range · Date · Venue"
    const fourPartMatch = primary.match(/^([^·]+)\s*·\s*(Up to 50 Guests|50[–-]100 Guests|100[–-]150 Guests|\d+[–-]\d+\s*Guests?|\d+\s*Guests?)\s*·\s*(?:\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})\s*·\s*([^·]+)(.*)$/i);
    if (fourPartMatch) {
      const occasion = fourPartMatch[1].trim();
      const guestRange = fourPartMatch[2].trim().replace(/\s*-\s*/g, "–");
      const venue = fourPartMatch[3].trim();
      const rest = fourPartMatch[4]?.trim() || "";
      primary = `${occasion} · ${guestRange} · ${venue}${rest ? ` ${rest}` : ""}`;
    } else {
      // 2. Detect Dining Hall legacy or uncleaned patterns:
      const diningRegex = /^(?:Hotel Fremont Dining Hall table enquiry for (\d+)\s*guests? on (?:\d{4}-\d{2}-\d{2}) at (?:\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)(?:\.\s*Seating:\s*([^·]+))?|Dining Hall Table\s*·\s*(\d+)\s*Guests?\s*·\s*(?:\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})(?:\s*at\s*[^·]+)?\s*·\s*Seating:\s*([^·]+))(.*)$/i;
      const diningMatch = primary.match(diningRegex);
      if (diningMatch) {
        const guests = diningMatch[1] || diningMatch[3] || "2";
        const seating = (diningMatch[2] || diningMatch[4] || "Main Dining Hall").trim();
        let special = "";
        const remainder = diningMatch[5] || "";
        const specialMatch = remainder.match(/·\s*Special:\s*(.+)$/i);
        if (specialMatch) {
          special = ` · Special: ${specialMatch[1].trim()}`;
        }
        primary = `Dining Hall Table · ${guests} Guests · Seating: ${seating}${special}`;
      }
    }
  }

  // General hygiene passes
  primary = primary
    .replace(/guests?\s+guests?/gi, "Guests")
    .replace(/~\s*(\d)/g, "$1")
    .replace(/\s*-\s*(\d)/g, "–$1");

  // Deduplicate identical tokens separated by " · "
  const tokens = primary.split(/\s*·\s*/).map((t) => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const dedupedTokens: string[] = [];
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      dedupedTokens.push(token);
    }
  }
  primary = dedupedTokens.join(" · ");

  return staffNotes ? `${primary}\n${staffNotes}` : primary;
}

/**
 * Builds a clean, professional enquiry summary matching submitted form data (without repeating dates)
 */
export function formatEnquirySummary(input: {
  type: string;
  name?: string;
  dates?: string;
  guests?: number;
  details?: Record<string, any>;
  notes?: string;
}): string {
  if (input.type === "event_banquet" || input.type === "conference") {
    const occasion = input.details?.eventType || "Special Event";
    const guestRange = normalizeGuestRange(input.details?.guestRange || input.guests);
    const venue = input.details?.venue || (input.type === "conference" ? "Conference Hall" : "Cloud 6 Banquet");
    const notes = input.details?.notes && input.details.notes !== "None" ? ` · Notes: ${input.details.notes}` : "";
    return `${occasion} · ${guestRange} · ${venue}${notes}`;
  }

  if (input.type === "dining" || input.type === "dining_aura") {
    const guests = input.guests || 2;
    const seating = input.details?.seating || "Main Dining Hall";
    const special = input.details?.specialRequests && input.details.specialRequests !== "None"
      ? ` · Special: ${input.details.specialRequests}`
      : "";
    return `Dining Hall Table · ${guests} Guests · Seating: ${seating}${special}`;
  }

  if (input.notes) {
    return cleanEnquiryNotes(input.notes);
  }

  return "General Enquiry";
}

/**
 * Helper to determine date label based on enquiry type
 */
export function getEnquiryDateLabel(type: string): string {
  if (type === "dining" || type === "dining_aura") return "Preferred Dining Date";
  if (type === "event_banquet" || type === "conference") return "Event Date";
  if (type === "book_now" || type === "rate_check") return "Stay Dates";
  return "Requested Date";
}
