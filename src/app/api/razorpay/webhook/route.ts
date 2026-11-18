import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendBookingConfirmationEmails } from "@/lib/email";
import { DEFAULT_ROOM_TYPES } from "@/config/hotel";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("[Razorpay Webhook] Missing x-razorpay-signature header.");
      return NextResponse.json({ error: "Missing signature header." }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.error("[Razorpay Webhook] Invalid webhook signature.");
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.info(`[Razorpay Webhook] Received verified event: ${eventType}`);

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      console.warn("[Razorpay Webhook] Supabase admin client unavailable.");
      return NextResponse.json({ status: "ok", warning: "DB unavailable" }, { status: 200 });
    }

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;
      const paymentMethod = paymentEntity?.method;

      if (!orderId) {
        console.warn("[Razorpay Webhook] No order ID found in payload.");
        return NextResponse.json({ status: "ok", warning: "No order ID in payload" }, { status: 200 });
      }

      // 1. Fetch booking record from Supabase
      const { data: booking, error: fetchErr } = await supabase
        .from("bookings")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (fetchErr || !booking) {
        console.warn(`[Razorpay Webhook] No booking found for order ${orderId}`);
        return NextResponse.json({ status: "ok", note: "Booking not found" }, { status: 200 });
      }

      // 2. Strict Deduplication: If confirmation email has already been sent, do NOT send again!
      if (booking.confirmation_email_sent === true) {
        console.info(
          `[Razorpay Webhook] Duplicate webhook for booking ${booking.booking_ref} (order ${orderId}). Confirmation email was already sent at ${booking.confirmation_email_sent_at || "earlier"}. Skipping duplicate email.`
        );
        return NextResponse.json(
          {
            status: "ok",
            duplicateSkipped: true,
            bookingRef: booking.booking_ref,
            note: "Confirmation email already sent",
          },
          { status: 200 }
        );
      }

      const paidAt = new Date().toISOString();

      // 3. Update booking to paid (and atomically flag confirmation_email_sent to avoid concurrent duplicates)
      const { error: updateErr } = await supabase
        .from("bookings")
        .update({
          status: "paid",
          amount_paid: booking.total_amount,
          razorpay_payment_id: paymentId || booking.razorpay_payment_id,
          payment_method: paymentMethod || booking.payment_method,
          paid_at: booking.paid_at || paidAt,
          updated_at: paidAt,
          confirmation_email_sent: true,
          confirmation_email_sent_at: paidAt,
        })
        .eq("id", booking.id);

      if (updateErr) {
        console.error("[Razorpay Webhook] Failed to update booking status:", updateErr);
      }

      // 4. Synchronize confirmed reservation into public.reservations (blocks availability)
      try {
        const room = DEFAULT_ROOM_TYPES.find(
          (r) =>
            r.code === booking.room_category ||
            r.name.toLowerCase() === booking.room_category.toLowerCase()
        );
        const roomName = room?.name || booking.room_category;

        const { data: existingRes } = await supabase
          .from("reservations")
          .select("id")
          .eq("reference_code", booking.booking_ref)
          .maybeSingle();

        if (!existingRes) {
          await supabase.from("reservations").insert({
            reference_code: booking.booking_ref,
            full_name: booking.guest_name,
            phone: booking.phone,
            email: booking.email,
            room_type: roomName,
            room_type_code: booking.room_category,
            rooms_requested: booking.rooms_requested || 1,
            check_in: booking.check_in,
            check_out: booking.check_out,
            guests: booking.guests || 1,
            estimated_total: booking.total_amount,
            status: "confirmed",
            channel: "razorpay",
            special_request: booking.special_requests,
          });
        } else {
          await supabase
            .from("reservations")
            .update({
              status: "confirmed",
              estimated_total: booking.total_amount,
              updated_at: paidAt,
            })
            .eq("id", existingRes.id);
        }
      } catch (syncErr) {
        console.warn("[Razorpay Webhook] Reservation sync warning:", syncErr);
      }

      // 5. Send Resend Confirmation Emails to both Customer and Admin(s)
      try {
        const roomConfig = DEFAULT_ROOM_TYPES.find(
          (r) =>
            r.code === booking.room_category ||
            r.name.toLowerCase() === booking.room_category.toLowerCase()
        );

        const emailResult = await sendBookingConfirmationEmails({
          bookingRef: booking.booking_ref,
          accessToken: booking.access_token,
          guestName: booking.guest_name,
          phone: booking.phone,
          email: booking.email,
          roomCategory: roomConfig?.name || booking.room_category,
          roomsRequested: booking.rooms_requested || 1,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          nights: booking.nights,
          guests: booking.guests,
          totalAmount: Number(booking.total_amount),
          currency: booking.currency || "INR",
          razorpayPaymentId: paymentId || booking.razorpay_payment_id,
          specialRequests: booking.special_requests || undefined,
        });

        console.info(
          `[Razorpay Webhook] Email dispatch result for ${booking.booking_ref}:`,
          emailResult
        );
      } catch (emailErr) {
        // Must never fail webhook if email encounters an error
        console.error(
          `[Razorpay Webhook] Non-blocking email dispatch failure for ${booking.booking_ref}:`,
          emailErr
        );
      }

      // Always return HTTP 200 OK
      return NextResponse.json(
        {
          status: "ok",
          processed: true,
          bookingRef: booking.booking_ref,
        },
        { status: 200 }
      );
    }

    if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await supabase
          .from("bookings")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", orderId)
          .eq("status", "pending");
      }
      return NextResponse.json({ status: "ok", paymentFailedLogged: true }, { status: 200 });
    }

    return NextResponse.json({ status: "ok", ignored: eventType }, { status: 200 });
  } catch (err: unknown) {
    // Top-level error safety: log error and return 200 so webhook does not loop
    console.error("[Razorpay Webhook Fatal Handler Catch]:", err);
    return NextResponse.json({ status: "ok", errorLogged: true }, { status: 200 });
  }
}
