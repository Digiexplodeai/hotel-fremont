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

/**
 * Sends booking confirmation emails to both the hotel and the guest.
 * Uses Resend API if RESEND_API_KEY is configured.
 * Gracefully logs and skips if no email service key is provided.
 * Never throws — email delivery failure will not abort the payment flow.
 */
export async function sendBookingConfirmationEmails(booking: BookingEmailData): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const hotelNotifyEmail = process.env.HOTEL_NOTIFY_EMAIL || PAYMENT_CONFIG.DEFAULT_HOTEL_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Hotel Fremont <bookings@hotelfremont.in>";

  if (!resendApiKey) {
    console.info(
      `[Email] RESEND_API_KEY not configured. Skipping confirmation email for booking ${booking.bookingRef}. Notifications can be configured with RESEND_API_KEY.`
    );
    return;
  }

  const siteUrl = SITE_CONFIG.siteUrl || "https://www.hotelfremont.in";
  const confirmationUrl = `${siteUrl}/booking-confirmation/${booking.bookingRef}?t=${booking.accessToken}`;
  const policyUrl = `${siteUrl}/cancellation-refund-policy`;

  // 1. Hotel Notification Email
  const hotelEmailSubject = `New Confirmed Booking: ${booking.bookingRef} - ${booking.guestName}`;
  const hotelEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0f0f10; padding: 24px; text-align: center; border-bottom: 2px solid #E02B1D;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">HOTEL FREMONT</h1>
        <p style="color: #c5a880; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">New Online Booking Received (Paid in Full)</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; margin-top: 0;">A new paid reservation has been confirmed via Razorpay.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Booking Reference</td>
            <td style="padding: 10px 0; font-weight: 700; color: #E02B1D; text-align: right;">${booking.bookingRef}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Guest Name</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right;">${booking.guestName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Phone</td>
            <td style="padding: 10px 0; text-align: right;"><a href="tel:${booking.phone}" style="color: #0284c7;">${booking.phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Email</td>
            <td style="padding: 10px 0; text-align: right;"><a href="mailto:${booking.email}" style="color: #0284c7;">${booking.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Room Category</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right;">${booking.roomCategory}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Rooms Booked</td>
            <td style="padding: 10px 0; text-align: right;">${booking.roomsRequested} room(s)</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Check-in / Check-out</td>
            <td style="padding: 10px 0; text-align: right;">${booking.checkIn} to ${booking.checkOut} (${booking.nights} night${booking.nights > 1 ? "s" : ""})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Guests</td>
            <td style="padding: 10px 0; text-align: right;">${booking.guests} guest(s)</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 0; color: #666; font-weight: 500;">Total Paid (Online)</td>
            <td style="padding: 10px 0; font-size: 16px; font-weight: 700; color: #16a34a; text-align: right;">₹${booking.totalAmount.toLocaleString("en-IN")}</td>
          </tr>
          ${
            booking.razorpayPaymentId
              ? `<tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 10px 0; color: #666; font-weight: 500;">Razorpay Payment ID</td>
                  <td style="padding: 10px 0; font-family: monospace; font-size: 13px; text-align: right;">${booking.razorpayPaymentId}</td>
                </tr>`
              : ""
          }
          ${
            booking.specialRequests
              ? `<tr>
                  <td style="padding: 10px 0; color: #666; font-weight: 500;">Special Requests</td>
                  <td style="padding: 10px 0; text-align: right;">${booking.specialRequests}</td>
                </tr>`
              : ""
          }
        </table>

        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${siteUrl}/admin" style="background-color: #E02B1D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; display: inline-block;">View in Admin Dashboard</a>
        </div>
      </div>
    </div>
  `;

  // 2. Guest Confirmation Email
  const guestEmailSubject = `Reservation Confirmation - Hotel Fremont (${booking.bookingRef})`;
  const guestEmailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0f0f10; padding: 32px 24px; text-align: center; border-bottom: 2px solid #E02B1D;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 3px; text-transform: uppercase;">HOTEL FREMONT</h1>
        <p style="color: #c5a880; margin: 8px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Reservation Confirmed</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; margin-top: 0;">Dear <strong>${booking.guestName}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">
          Thank you for choosing Hotel Fremont. We are delighted to confirm your upcoming stay with us. Your booking is fully confirmed and 100% paid online.
        </p>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 12px;">
            <span style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</span>
            <span style="font-size: 16px; font-weight: 700; color: #E02B1D; letter-spacing: 1px;">${booking.bookingRef}</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Room Category</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right;">${booking.roomCategory}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Number of Rooms</td>
              <td style="padding: 6px 0; text-align: right;">${booking.roomsRequested} room(s)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Check-in</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right;">${booking.checkIn} (${SITE_CONFIG.checkInTime})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Check-out</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right;">${booking.checkOut} (${SITE_CONFIG.checkOutTime})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Duration</td>
              <td style="padding: 6px 0; text-align: right;">${booking.nights} night${booking.nights > 1 ? "s" : ""}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Total Paid (Incl. 18% GST)</td>
              <td style="padding: 6px 0; font-weight: 700; color: #16a34a; font-size: 16px; text-align: right;">₹${booking.totalAmount.toLocaleString("en-IN")}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${confirmationUrl}" style="background-color: #E02B1D; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; display: inline-block;">View Booking Receipt & Pass</a>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #E02B1D; padding: 14px 16px; margin: 24px 0; font-size: 13px; color: #7f1d1d;">
          <strong style="display: block; margin-bottom: 4px; color: #991b1b;">Cancellation & Refund Policy</strong>
          ${PAYMENT_CONFIG.CANCELLATION_SUMMARY}
          <div style="margin-top: 6px;">
            <a href="${policyUrl}" style="color: #b91c1c; text-decoration: underline;">Read full cancellation policy &rarr;</a>
          </div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px; font-size: 13px; color: #6b7280;">
          <p style="margin: 0 0 6px 0; font-weight: 600; color: #1f2937;">Hotel Fremont</p>
          <p style="margin: 0 0 4px 0;">${SITE_CONFIG.address}</p>
          <p style="margin: 0 0 4px 0;">Phone: <a href="tel:${SITE_CONFIG.phone}" style="color: #0284c7;">${SITE_CONFIG.phone}</a></p>
          <p style="margin: 0 0 0 0;">Email: <a href="mailto:${SITE_CONFIG.email}" style="color: #0284c7;">${SITE_CONFIG.email}</a></p>
        </div>
      </div>
    </div>
  `;

  // Send asynchronously with Resend REST API
  try {
    const sendResendEmail = async (to: string, subject: string, html: string) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn(`[Resend Email Warning] Failed to send email to ${to}: ${res.status} ${body}`);
      }
    };

    // Send both in parallel
    await Promise.allSettled([
      sendResendEmail(hotelNotifyEmail, hotelEmailSubject, hotelEmailHtml),
      sendResendEmail(booking.email, guestEmailSubject, guestEmailHtml),
    ]);
  } catch (err) {
    console.warn("[Resend Email Warning] Error during email dispatch:", err);
  }
}
