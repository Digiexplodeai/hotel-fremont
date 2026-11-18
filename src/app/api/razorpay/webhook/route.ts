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
    console.info(`[Razorpay Webhook] Received event: ${eventType}`);

    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      console.warn("[Razorpay Webhook] Supabase admin client unavailable.");
      return NextResponse.json({ status: "ok", warning: "DB unavailable" });
    }

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;
      const paymentMethod = paymentEntity?.method;

      if (!orderId) {
        return NextResponse.json({ status: "ok", warning: "No order ID in payload" });
      }

      // Find booking
      const { data: booking, error: fetchErr } = await supabase
        .from("bookings")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (fetchErr || !booking) {
        console.warn(`[Razorpay Webhook] No booking found for order ${orderId}`);
        return NextResponse.json({ status: "ok", note: "Booking not found" });
      }

      // Idempotency: If already paid, do not re-process
      if (booking.status === "paid") {
        return NextResponse.json({ status: "ok", note: "Already processed" });
      }

      const paidAt = new Date().toISOString();

      // Update booking to paid
      await supabase
        .from("bookings")
        .update({
          status: "paid",
          amount_paid: booking.total_amount,
          razorpay_payment_id: paymentId || booking.razorpay_payment_id,
          payment_method: paymentMethod || booking.payment_method,
          paid_at: paidAt,
          updated_at: paidAt,
        })
        .eq("id", booking.id);

      // Sync confirmed reservation to public.reservations
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
        console.warn("[Razorpay Webhook] Reservation sync error:", syncErr);
      }

      // Send emails
      sendBookingConfirmationEmails({
        bookingRef: booking.booking_ref,
        accessToken: booking.access_token,
        guestName: booking.guest_name,
        phone: booking.phone,
        email: booking.email,
        roomCategory:
          DEFAULT_ROOM_TYPES.find((r) => r.code === booking.room_category)?.name ||
          booking.room_category,
        roomsRequested: booking.rooms_requested || 1,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        nights: booking.nights,
        guests: booking.guests,
        totalAmount: Number(booking.total_amount),
        currency: booking.currency || "INR",
        razorpayPaymentId: paymentId,
        specialRequests: booking.special_requests || undefined,
      }).catch((emailErr) => console.warn("[Webhook email error]:", emailErr));

      return NextResponse.json({ status: "ok", processed: true });
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
      return NextResponse.json({ status: "ok", paymentFailedLogged: true });
    }

    return NextResponse.json({ status: "ok", ignored: eventType });
  } catch (err: unknown) {
    console.error("[Razorpay Webhook Error]:", err);
    return NextResponse.json({ error: "Webhook processing failure." }, { status: 500 });
  }
}
