import "server-only";
import { PAYMENT_CONFIG } from "./payment-config";
import { SITE_CONFIG } from "./site-config";

export interface BookingEmailData {
  bookingRef: string;
  accessToken: string;
  guestName: string;
  phone: string;
  email: string;
  roomCategory: string;
  roomsRequested: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  currency: string;
  razorpayPaymentId?: string;
  specialRequests?: string;
}

export interface SendEmailResult {
  success: boolean;
  customerSent: boolean;
  adminSent: boolean;
  adminRecipients: string[];
  customerRecipient?: string;
  error?: string;
}

/**
 * Extracts and sanitizes admin email addresses from ADMIN_EMAILS environment variable.
 * Expects comma-separated emails. Falls back to HOTEL_NOTIFY_EMAIL or default if empty.
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  if (emails.length > 0) {
    return Array.from(new Set(emails));
  }

  const fallback =
    process.env.HOTEL_NOTIFY_EMAIL?.trim().toLowerCase() ||
    PAYMENT_CONFIG.DEFAULT_HOTEL_EMAIL;

  return [fallback];
}

/**
 * Gets the configured From email address.
 * Prioritizes FROM_EMAIL, with fallback to RESEND_FROM_EMAIL.
 */
export function getFromEmail(): string {
  return (
    process.env.FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Hotel Fremont <bookings@hotelfremont.in>"
  );
}

/**
 * Sends booking confirmation emails to both the customer and admin(s) via Resend.
 * Completely fault-tolerant: Catches all errors and never throws an exception.
 */
export async function sendBookingConfirmationEmails(
  booking: BookingEmailData
): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = getFromEmail();
  const adminEmails = getAdminEmails();
  const customerEmail = booking.email?.trim().toLowerCase();

  // If RESEND_API_KEY is not configured, log warning and gracefully return without failing
  if (!resendApiKey) {
    console.warn(
      `[Resend Email] RESEND_API_KEY is not configured in environment. Skipping email dispatch for booking ${booking.bookingRef}.`
    );
    return {
      success: false,
      customerSent: false,
      adminSent: false,
      adminRecipients: adminEmails,
      customerRecipient: customerEmail,
      error: "RESEND_API_KEY not configured",
    };
  }

  const siteUrl = SITE_CONFIG.siteUrl || "https://www.hotelfremont.in";
  const confirmationUrl = `${siteUrl}/booking-confirmation/${booking.bookingRef}?t=${booking.accessToken}`;
  const policyUrl = `${siteUrl}/cancellation-refund-policy`;
  const cleanPhone = booking.phone.replace(/\D/g, "");

  // 1. Hotel Admin Notification Email Template
  const adminEmailSubject = `[Confirmed Booking] ${booking.bookingRef} - ${booking.guestName} (${booking.roomCategory})`;
  const adminEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1a1a1a; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0E0E10; padding: 24px; text-align: center; border-bottom: 3px solid #E02B1D;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">HOTEL FREMONT</h1>
        <p style="color: #C9A96E; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Confirmed Online Booking (Paid in Full via Razorpay)</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 15px; margin-top: 0; color: #1f2937;">
          A new reservation has been confirmed and paid in full via <strong>Razorpay</strong>.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Booking Reference</td>
            <td style="padding: 10px 0; font-weight: 700; color: #E02B1D; text-align: right; font-family: monospace; font-size: 15px;">${booking.bookingRef}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Guest Name</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right;">${booking.guestName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Phone Number</td>
            <td style="padding: 10px 0; text-align: right;">
              <a href="tel:${booking.phone}" style="color: #0284c7; text-decoration: none; font-weight: 600;">${booking.phone}</a>
              <span style="color: #9ca3af; margin: 0 4px;">·</span>
              <a href="https://wa.me/${cleanPhone}" target="_blank" style="color: #16a34a; text-decoration: none; font-weight: 600;">WhatsApp</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Email Address</td>
            <td style="padding: 10px 0; text-align: right;">
              <a href="mailto:${booking.email}" style="color: #0284c7; text-decoration: none;">${booking.email}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Room Category</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right;">${booking.roomCategory}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Rooms Booked</td>
            <td style="padding: 10px 0; text-align: right;">${booking.roomsRequested} room(s)</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Check-In</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right;">${booking.checkIn} (${SITE_CONFIG.checkInTime})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Check-Out</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right;">${booking.checkOut} (${SITE_CONFIG.checkOutTime})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Duration</td>
            <td style="padding: 10px 0; text-align: right;">${booking.nights} night${booking.nights > 1 ? "s" : ""}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Guests Count</td>
            <td style="padding: 10px 0; text-align: right;">${booking.guests} guest(s)</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Total Amount Paid</td>
            <td style="padding: 10px 0; font-size: 16px; font-weight: 700; color: #16a34a; text-align: right;">
              ₹${booking.totalAmount.toLocaleString("en-IN")}
              <div style="font-size: 11px; font-weight: normal; color: #6b7280;">100% Online Payment (Incl. 18% GST)</div>
            </td>
          </tr>
          ${
            booking.razorpayPaymentId
              ? `<tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Razorpay Payment ID</td>
                  <td style="padding: 10px 0; font-family: monospace; font-size: 13px; text-align: right;">${booking.razorpayPaymentId}</td>
                </tr>`
              : ""
          }
          ${
            booking.specialRequests
              ? `<tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Special Requests</td>
                  <td style="padding: 10px 0; text-align: right; color: #374151;">${booking.specialRequests}</td>
                </tr>`
              : ""
          }
        </table>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${siteUrl}/admin" style="background-color: #E02B1D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            Open in Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  // 2. Customer Confirmation Email Template
  const customerEmailSubject = `Your Reservation Confirmation - Hotel Fremont (${booking.bookingRef})`;
  const customerEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1a1a1a; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0E0E10; padding: 32px 24px; text-align: center; border-bottom: 3px solid #E02B1D;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 3px; text-transform: uppercase;">HOTEL FREMONT</h1>
        <p style="color: #C9A96E; margin: 8px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Reservation Confirmed · 100% Paid Online</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; margin-top: 0; color: #111827;">Dear <strong>${booking.guestName}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">
          Thank you for choosing Hotel Fremont. We are delighted to confirm your upcoming stay. Your booking is confirmed and paid in full online via Razorpay.
        </p>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</span>
            <span style="font-size: 18px; font-weight: 700; color: #E02B1D; letter-spacing: 1px; font-family: monospace;">${booking.bookingRef}</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Room Category</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">${booking.roomCategory}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Number of Rooms</td>
              <td style="padding: 6px 0; text-align: right; color: #111827;">${booking.roomsRequested} room(s)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Check-In</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">${booking.checkIn} (from ${SITE_CONFIG.checkInTime})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Check-Out</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">${booking.checkOut} (until ${SITE_CONFIG.checkOutTime})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Duration</td>
              <td style="padding: 6px 0; text-align: right; color: #111827;">${booking.nights} night${booking.nights > 1 ? "s" : ""}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Guests</td>
              <td style="padding: 6px 0; text-align: right; color: #111827;">${booking.guests} guest(s)</td>
            </tr>
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 10px 0 4px 0; color: #374151; font-weight: 600;">Total Amount Paid</td>
              <td style="padding: 10px 0 4px 0; font-weight: 700; color: #16a34a; font-size: 18px; text-align: right;">₹${booking.totalAmount.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 0 0 6px 0; font-size: 11px; color: #6b7280;">Payment Status</td>
              <td style="padding: 0 0 6px 0; font-size: 11px; color: #16a34a; text-align: right;">100% Full Payment Settled Online (Incl. 18% GST)</td>
            </tr>
            ${
              booking.razorpayPaymentId
                ? `<tr>
                    <td style="padding: 4px 0; font-size: 11px; color: #9ca3af;">Razorpay Payment ID</td>
                    <td style="padding: 4px 0; font-family: monospace; font-size: 11px; color: #6b7280; text-align: right;">${booking.razorpayPaymentId}</td>
                  </tr>`
                : ""
            }
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${confirmationUrl}" style="background-color: #E02B1D; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            View Official Stay Pass &amp; Receipt
          </a>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #E02B1D; padding: 14px 16px; margin: 24px 0; font-size: 13px; color: #7f1d1d; border-radius: 0 6px 6px 0;">
          <strong style="display: block; margin-bottom: 4px; color: #991b1b;">Cancellation &amp; Refund Policy</strong>
          ${PAYMENT_CONFIG.CANCELLATION_SUMMARY}
          <div style="margin-top: 8px;">
            <a href="${policyUrl}" style="color: #b91c1c; text-decoration: underline; font-weight: 500;">Read complete policy &rarr;</a>
          </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px; font-size: 13px; color: #6b7280;">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937;">${SITE_CONFIG.siteName}</p>
          <p style="margin: 0 0 4px 0;">${SITE_CONFIG.address}</p>
          <p style="margin: 0 0 4px 0;">Phone: <a href="tel:${SITE_CONFIG.phone}" style="color: #0284c7; text-decoration: none;">${SITE_CONFIG.phone}</a></p>
          <p style="margin: 0 0 0 0;">Email: <a href="mailto:${SITE_CONFIG.email}" style="color: #0284c7; text-decoration: none;">${SITE_CONFIG.email}</a></p>
        </div>
      </div>
    </div>
  `;

  let customerSent = false;
  let adminSent = false;
  let errorMessage: string | undefined;

  // Single helper to POST to Resend API
  const sendEmailViaResend = async (
    recipients: string[],
    subject: string,
    html: string
  ): Promise<boolean> => {
    if (!recipients || recipients.length === 0) return false;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: recipients,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(
          `[Resend Email Error] HTTP ${response.status} sending to [${recipients.join(", ")}]:`,
          errorText
        );
        errorMessage = `HTTP ${response.status}: ${errorText}`;
        return false;
      }

      const responseData = await response.json().catch(() => ({}));
      console.info(
        `[Resend Email Success] Email sent to [${recipients.join(", ")}], id: ${responseData.id || "ok"}`
      );
      return true;
    } catch (fetchErr) {
      console.error(
        `[Resend Email Exception] Error connecting to Resend API for [${recipients.join(", ")}]:`,
        fetchErr
      );
      errorMessage = fetchErr instanceof Error ? fetchErr.message : "Network failure";
      return false;
    }
  };

  try {
    // Dispatch to Customer and Admin(s) in parallel
    const tasks: Promise<boolean>[] = [];

    // Admin email task
    if (adminEmails.length > 0) {
      tasks.push(
        sendEmailViaResend(adminEmails, adminEmailSubject, adminEmailHtml).then(
          (success) => {
            adminSent = success;
            return success;
          }
        )
      );
    }

    // Customer email task
    if (customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      tasks.push(
        sendEmailViaResend([customerEmail], customerEmailSubject, customerEmailHtml).then(
          (success) => {
            customerSent = success;
            return success;
          }
        )
      );
    } else {
      console.warn(
        `[Resend Email Warning] Customer email missing or invalid (${customerEmail}). Skipping customer email.`
      );
    }

    await Promise.allSettled(tasks);
  } catch (outerErr) {
    console.error("[Resend Email Warning] Unexpected error during email dispatch:", outerErr);
  }

  return {
    success: customerSent || adminSent,
    customerSent,
    adminSent,
    adminRecipients: adminEmails,
    customerRecipient: customerEmail,
    error: errorMessage,
  };
}
