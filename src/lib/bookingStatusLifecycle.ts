/**
 * HOTEL FREMONT: BOOKING LIFECYCLE & STATE MACHINE LOGIC
 * Manages operational booking statuses, valid transitions, and metadata packing.
 */

export type OperationalBookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled";

export type OperationalPaymentStatus =
  | "paid"
  | "pending"
  | "refunded"
  | "failed";

export interface BookingLifecycleMetadata {
  status: OperationalBookingStatus;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  roomNumber?: string | null;
  earlyDeparture?: boolean;
  updatedBy?: string;
  history?: Array<{
    status: OperationalBookingStatus;
    timestamp: string;
    updatedBy?: string;
    notes?: string;
  }>;
}

const METADATA_PREFIX = "[HF_OPERATIONAL:";
const METADATA_SUFFIX = "]";

/**
 * Packs operational metadata into a string alongside customer special requests / notes.
 */
export function packOperationalMetadata(
  existingNotes: string | null | undefined,
  metadata: BookingLifecycleMetadata
): string {
  const cleanOriginalNotes = unpackOperationalMetadata(existingNotes).cleanNotes;
  const jsonStr = JSON.stringify(metadata);
  const tag = `${METADATA_PREFIX}${jsonStr}${METADATA_SUFFIX}`;
  return cleanOriginalNotes ? `${tag} ${cleanOriginalNotes}` : tag;
}

/**
 * Unpacks operational metadata and returns the original customer notes without the metadata tag.
 */
export function unpackOperationalMetadata(rawNotes: string | null | undefined): {
  metadata: BookingLifecycleMetadata | null;
  cleanNotes: string;
} {
  if (!rawNotes || typeof rawNotes !== "string") {
    return { metadata: null, cleanNotes: "" };
  }

  const startIdx = rawNotes.indexOf(METADATA_PREFIX);
  if (startIdx === -1) {
    return { metadata: null, cleanNotes: rawNotes.trim() };
  }

  const endIdx = rawNotes.indexOf(METADATA_SUFFIX, startIdx + METADATA_PREFIX.length);
  if (endIdx === -1) {
    return { metadata: null, cleanNotes: rawNotes.trim() };
  }

  const jsonStr = rawNotes.slice(startIdx + METADATA_PREFIX.length, endIdx);
  const cleanNotes = (rawNotes.slice(0, startIdx) + rawNotes.slice(endIdx + METADATA_SUFFIX.length)).trim();

  try {
    const metadata = JSON.parse(jsonStr) as BookingLifecycleMetadata;
    return { metadata, cleanNotes };
  } catch {
    return { metadata: null, cleanNotes: rawNotes.trim() };
  }
}

/**
 * Validates whether a state machine transition is permitted.
 */
export function validateBookingStatusTransition(
  currentStatus: OperationalBookingStatus,
  targetStatus: OperationalBookingStatus,
  isAdministrativeOverride = false
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: `Booking is already in '${currentStatus.toUpperCase().replace(/_/g, " ")}' status.` };
  }

  // Terminal state protections
  if (currentStatus === "checked_out" && !isAdministrativeOverride) {
    return {
      allowed: false,
      reason: "Stay has already been checked out. Checked Out is a terminal operational state.",
    };
  }

  if (currentStatus === "cancelled" && !isAdministrativeOverride) {
    return {
      allowed: false,
      reason: "Booking is cancelled. Cancelled is a terminal state. Administrative restoration requires explicit override.",
    };
  }

  switch (currentStatus) {
    case "pending":
      if (targetStatus === "confirmed" || targetStatus === "cancelled") {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Pending bookings must be confirmed before checking in or checking out.",
      };

    case "confirmed":
      if (targetStatus === "checked_in" || targetStatus === "cancelled") {
        return { allowed: true };
      }
      if (targetStatus === "checked_out") {
        return {
          allowed: false,
          reason: "Guest must be checked in before marking checked out.",
        };
      }
      return { allowed: false, reason: `Invalid transition from Confirmed to ${targetStatus}.` };

    case "checked_in":
      if (targetStatus === "checked_out") {
        return { allowed: true };
      }
      if (targetStatus === "cancelled") {
        if (!isAdministrativeOverride) {
          return {
            allowed: false,
            reason:
              "In-house stay: guest is already checked in. Use 'Mark Checked Out' for early departure. Exceptional voiding or cancellation requires administrative override.",
          };
        }
        return { allowed: true };
      }
      if (targetStatus === "confirmed") {
        return {
          allowed: false,
          reason: "Stay is already in-house (checked in). Cannot revert to confirmed.",
        };
      }
      return { allowed: false, reason: `Invalid transition from Checked In to ${targetStatus}.` };

    default:
      if (isAdministrativeOverride) return { allowed: true };
      return { allowed: false, reason: `Unknown transition from ${currentStatus} to ${targetStatus}.` };
  }
}

/**
 * Resolves authoritative operational booking status from both DB status and embedded metadata.
 */
export function resolveAuthoritativeStatus(
  rawStatus: string | null | undefined,
  rawNotes: string | null | undefined
): {
  bookingStatus: OperationalBookingStatus;
  paymentStatus: OperationalPaymentStatus;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  roomNumber?: string | null;
  cleanNotes: string;
} {
  const { metadata, cleanNotes } = unpackOperationalMetadata(rawNotes);
  const s = (rawStatus || "").toLowerCase().trim();

  // Determine Payment Status
  let paymentStatus: OperationalPaymentStatus = "pending";
  if (s === "paid" || s === "confirmed" || metadata?.status === "checked_in" || metadata?.status === "checked_out") {
    paymentStatus = "paid";
  } else if (s === "refunded") {
    paymentStatus = "refunded";
  } else if (s === "failed") {
    paymentStatus = "failed";
  }

  // Determine Booking Status
  // If metadata has explicit operational status, it takes precedence over unmigrated DB constraints
  let bookingStatus: OperationalBookingStatus = "confirmed";

  if (metadata?.status) {
    bookingStatus = metadata.status;
    if (metadata.status === "checked_in" || metadata.status === "checked_out" || metadata.status === "confirmed") {
      if (s !== "failed" && s !== "refunded") {
        paymentStatus = "paid";
      }
    }
  } else if (s === "checked_out") {
    bookingStatus = "checked_out";
  } else if (s === "checked_in") {
    bookingStatus = "checked_in";
  } else if (s === "cancelled") {
    bookingStatus = "cancelled";
  } else if (s === "pending" || s === "new" || s === "in_discussion") {
    bookingStatus = "pending";
    paymentStatus = "pending";
  } else if (s === "confirmed" || s === "paid" || s === "converted") {
    bookingStatus = "confirmed";
    paymentStatus = "paid";
  }

  return {
    bookingStatus,
    paymentStatus,
    checkedInAt: metadata?.checkedInAt || null,
    checkedOutAt: metadata?.checkedOutAt || null,
    roomNumber: metadata?.roomNumber || null,
    cleanNotes,
  };
}
