import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { DEFAULT_ROOM_TYPES } from "@/config/hotel";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_ref,
      access_token,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required Razorpay payment verification parameters." },
        { status: 400 }
      );
    }

    // 1. Cryptographically verify signature
    const isValid = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      console.error(
        `[Razorpay Signature Verification Failed] Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`
      );
      return NextResponse.json(
        { success: false, error: "Payment verification failed. Signature mismatch." },
        { status: 400 }
      );
    }

    // 2. Fetch booking from Supabase
    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      console.warn("[Payment Verify] Supabase admin client unavailable. Acknowledging signature valid.");
      return NextResponse.json({
        success: true,
        bookingRef: booking_ref,
        accessToken: access_token,
      });
    }

    // Look up booking by reference & access token or order ID
    let query = supabase.from("bookings").select("*");
    if (booking_ref && access_token) {
      query = query.eq("booking_ref", booking_ref).eq("access_token", access_token);
    } else {
      query = query.eq("razorpay_order_id", razorpay_order_id);
    }

    const { data: booking, error: fetchError } = await query.maybeSingle();

    if (fetchError || !booking) {
      console.error("[Payment Verify] Booking not found:", { booking_ref, razorpay_order_id });
      return NextResponse.json(
        { success: false, error: "Booking record not found for this transaction." },
        { status: 404 }
      );
    }

    // 3. Idempotency: If already paid, return success immediately
    if (booking.status === "paid") {
      return NextResponse.json({
        success: true,
        bookingRef: booking.booking_ref,
        accessToken: booking.access_token,
        alreadyProcessed: true,
      });
    }

    // 4. Update booking to paid
    const paidAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "paid",
        amount_paid: booking.total_amount,
        razorpay_payment_id,
        paid_at: paidAt,
        updated_at: paidAt,
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("[Payment Verify] Error updating booking status:", updateError);
    }

    // 5. Sync to public.reservations to immediately block availability calendar
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
    } catch (resErr) {
      console.warn("[Payment Verify] Reservations sync warning:", resErr);
    }

    return NextResponse.json({
      success: true,
      bookingRef: booking.booking_ref,
      accessToken: booking.access_token,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify payment.";
    console.error("[Payment Verify Exception]:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
