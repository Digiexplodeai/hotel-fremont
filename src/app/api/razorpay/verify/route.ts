import { NextRequest, NextResponse } from "next/server";
import {
  verifyRazorpayPaymentSignature,
  getRazorpayPayment,
  captureRazorpayPayment,
  isRazorpayTestMode,
} from "@/lib/razorpay";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { DEFAULT_ROOM_TYPES } from "@/config/hotel";
import { revalidatePath } from "next/cache";

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

    // 2. Fetch live payment status from Razorpay API
    let paymentDetails: any = null;
    let paymentStatus = "captured";
    let paymentMethod = "online";

    try {
      paymentDetails = await getRazorpayPayment(razorpay_payment_id);
      if (paymentDetails) {
        paymentStatus = paymentDetails.status; // 'authorized', 'captured', 'failed'
        paymentMethod = paymentDetails.method || "online";

        // Auto-capture if payment is authorized but not yet captured
        if (paymentStatus === "authorized" && paymentDetails.amount) {
          try {
            const captureRes = await captureRazorpayPayment(
              razorpay_payment_id,
              paymentDetails.amount,
              paymentDetails.currency || "INR"
            );
            if (captureRes && captureRes.status === "captured") {
              paymentStatus = "captured";
            }
          } catch (captureErr) {
            console.warn(`[Payment Verify] Auto-capture warning for ${razorpay_payment_id}:`, captureErr);
          }
        }

        if (paymentStatus === "failed") {
          return NextResponse.json(
            { success: false, error: "Payment was marked failed by the gateway." },
            { status: 400 }
          );
        }
      }
    } catch (apiErr) {
      // If Razorpay API fetch fails temporarily, fallback to signature validity
      console.warn(`[Payment Verify] Razorpay API status fetch warning:`, apiErr);
    }

    const isTestMode = isRazorpayTestMode();

    // 3. Fetch booking from Supabase
    const supabase = createAdminSupabaseClient();
    if (!supabase) {
      console.warn("[Payment Verify] Supabase admin client unavailable. Acknowledging signature valid.");
      return NextResponse.json({
        success: true,
        bookingRef: booking_ref,
        accessToken: access_token,
        isTestMode,
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

    // 4. Update payment details (preserve operational status like checked_in, checked_out, or cancelled)
    const paidAt = booking.paid_at || new Date().toISOString();
    const isAlreadyOperational = ["checked_in", "checked_out", "cancelled"].includes(booking.status);
    const targetStatus = isAlreadyOperational ? booking.status : "paid";

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: targetStatus,
        amount_paid: booking.total_amount,
        razorpay_payment_id,
        payment_method: paymentMethod,
        paid_at: paidAt,
        updated_at: new Date().toISOString(),
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
          amount_paid: booking.total_amount,
          status: "confirmed",
          channel: "razorpay",
          special_request: booking.special_requests,
          razorpay_order_id,
          razorpay_payment_id,
          payment_method: paymentMethod,
          paid_at: paidAt,
        });
      } else {
        await supabase
          .from("reservations")
          .update({
            status: "confirmed",
            channel: "razorpay",
            estimated_total: booking.total_amount,
            amount_paid: booking.total_amount,
            razorpay_order_id,
            razorpay_payment_id,
            payment_method: paymentMethod,
            paid_at: paidAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRes.id);
      }
    } catch (resErr) {
      console.warn("[Payment Verify] Reservations sync warning:", resErr);
    }

    // 6. Revalidate admin dashboard, calendar and public website cache
    try {
      revalidatePath("/admin");
      revalidatePath("/admin/reservations");
      revalidatePath("/admin/payments");
      revalidatePath("/admin/rooms");
      revalidatePath("/admin/calendar");
      revalidatePath("/", "layout");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      success: true,
      bookingRef: booking.booking_ref,
      accessToken: booking.access_token,
      isTestMode,
      paymentStatus: "PAID",
      bookingStatus: "CONFIRMED",
      paymentGateway: "Razorpay",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to verify payment.";
    console.error("[Payment Verify Exception]:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
