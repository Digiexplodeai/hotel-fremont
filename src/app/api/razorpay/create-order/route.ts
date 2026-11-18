import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { DEFAULT_ROOM_TYPES, HOTEL_CONFIG, validateIndianPhone } from "@/config/hotel";
import { calculateServerBookingPrice, PAYMENT_CONFIG } from "@/lib/payment-config";
import { createRazorpayOrder, getRazorpayCredentials } from "@/lib/razorpay";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // 1. IP-based rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateLimitKey = `order-create:${ip}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (rateCheck.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many booking requests from your network. Please try again in ${rateCheck.retryAfterMinutes || 15} minutes.`,
        },
        { status: 429 }
      );
    }

    // 2. Parse & validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON payload." }, { status: 400 });
    }

    const {
      guestName,
      phone,
      email,
      roomCategory,
      checkIn,
      checkOut,
      roomsRequested = 1,
      guests = 1,
      specialRequests,
      agreedToPolicy,
    } = body;

    // Policy agreement confirmation
    if (agreedToPolicy !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "You must accept the Terms and Conditions and Cancellation & Refund Policy to proceed.",
        },
        { status: 400 }
      );
    }

    // Guest Name validation
    if (!guestName || typeof guestName !== "string" || guestName.trim().length < 2 || guestName.trim().length > 100) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { success: false, error: "Please enter a valid guest name (2 to 100 characters)." },
        { status: 400 }
      );
    }

    // Phone validation
    const phoneValidation = validateIndianPhone(phone);
    if (!phoneValidation.isValid) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { success: false, error: phoneValidation.error || "Please provide a valid Indian mobile number." },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address for your booking confirmation." },
        { status: 400 }
      );
    }

    // Dates validation
    if (!checkIn || !checkOut || typeof checkIn !== "string" || typeof checkOut !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid check-in and check-out dates are required." },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (checkIn < todayStr) {
      return NextResponse.json(
        { success: false, error: "Check-in date cannot be in the past." },
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { success: false, error: "Check-out date must be after check-in date." },
        { status: 400 }
      );
    }

    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);
    const diffNights = Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 3600 * 24));
    if (diffNights < 1 || diffNights > HOTEL_CONFIG.maxStayNights) {
      return NextResponse.json(
        { success: false, error: `Stay duration must be between 1 and ${HOTEL_CONFIG.maxStayNights} nights.` },
        { status: 400 }
      );
    }

    // Room category lookup
    const room = DEFAULT_ROOM_TYPES.find(
      (r) =>
        r.code.toLowerCase() === (roomCategory || "").toLowerCase() ||
        r.name.toLowerCase() === (roomCategory || "").toLowerCase()
    );

    if (!room) {
      return NextResponse.json(
        { success: false, error: `Invalid room category: ${roomCategory}` },
        { status: 400 }
      );
    }

    const parsedRooms = Math.max(1, parseInt(String(roomsRequested), 10) || 1);
    if (parsedRooms > room.totalRooms) {
      return NextResponse.json(
        { success: false, error: `We only have ${room.totalRooms} keys for ${room.name}.` },
        { status: 400 }
      );
    }

    const parsedGuests = Math.max(1, parseInt(String(guests), 10) || 1);
    if (parsedGuests > parsedRooms * room.maxGuests) {
      return NextResponse.json(
        {
          success: false,
          error: `${parsedRooms} ${room.name} can accommodate up to ${parsedRooms * room.maxGuests} guests.`,
        },
        { status: 400 }
      );
    }

    // 3. Supabase verification & Concurrency Check
    const supabase = createAdminSupabaseClient();
    if (supabase) {
      // Clean up stale pending bookings first
      try {
        await supabase
          .from("bookings")
          .update({ status: "expired" })
          .eq("status", "pending")
          .lt("expires_at", new Date().toISOString());
      } catch (err) {
        console.warn("[Stale cleanup warning]:", err);
      }

      // Check overlapping active bookings
      const { data: overlappingBookings } = await supabase
        .from("bookings")
        .select("rooms_requested, check_in, check_out")
        .eq("room_category", room.code)
        .in("status", ["paid", "pending"])
        .lt("check_in", checkOut)
        .gt("check_out", checkIn);

      // Check overlapping confirmed reservations in the existing system
      const { data: overlappingReservations } = await supabase
        .from("reservations")
        .select("rooms_requested, check_in, check_out")
        .or(`room_type_code.eq.${room.code},room_type.ilike.%${room.name}%`)
        .in("status", ["confirmed", "converted"])
        .lt("check_in", checkOut)
        .gt("check_out", checkIn);

      // Calculate max occupied rooms on any night during stay
      const occupancyByDate: Record<string, number> = {};
      const allActive = [
        ...(overlappingBookings || []),
        ...(overlappingReservations || []),
      ];

      for (const item of allActive) {
        const itemStart = new Date(item.check_in);
        const itemEnd = new Date(item.check_out);
        for (let d = new Date(itemStart); d < itemEnd; d.setDate(d.getDate() + 1)) {
          const dKey = d.toISOString().slice(0, 10);
          if (dKey >= checkIn && dKey < checkOut) {
            occupancyByDate[dKey] = (occupancyByDate[dKey] || 0) + (item.rooms_requested || 1);
          }
        }
      }

      const peakOccupied = Math.max(0, ...Object.values(occupancyByDate));
      if (peakOccupied + parsedRooms > room.totalRooms) {
        return NextResponse.json(
          {
            success: false,
            error: `Apologies, only ${Math.max(0, room.totalRooms - peakOccupied)} room(s) are left for ${room.name} on the selected dates.`,
          },
          { status: 409 }
        );
      }
    }

    // 4. Calculate server-side price (strictly tamper-proof)
    const price = calculateServerBookingPrice(room.code, checkIn, checkOut, parsedRooms);

    // 5. Generate secure identifiers
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const bookingRef = `${HOTEL_CONFIG.refCodePrefix}${randomSuffix}`; // e.g. FRM-A1B2C3
    const accessToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + PAYMENT_CONFIG.HOLD_MINUTES * 60 * 1000).toISOString();

    // 6. Create Razorpay order
    const { keyId } = getRazorpayCredentials();
    const order = await createRazorpayOrder({
      amountPaise: price.amountInPaise,
      currency: PAYMENT_CONFIG.CURRENCY,
      receipt: bookingRef,
      notes: {
        bookingRef,
        guestName: guestName.trim(),
        phone: phoneValidation.cleanPhone,
        email: email.trim().toLowerCase(),
        roomCategory: room.code,
        checkIn,
        checkOut,
        roomsRequested: String(parsedRooms),
        guests: String(parsedGuests),
      },
    });

    // 7. Store pending booking in Supabase
    if (supabase) {
      const { error: insertError } = await supabase.from("bookings").insert({
        booking_ref: bookingRef,
        access_token: accessToken,
        guest_name: guestName.trim(),
        phone: phoneValidation.cleanPhone,
        email: email.trim().toLowerCase(),
        room_category: room.code,
        rooms_requested: parsedRooms,
        check_in: checkIn,
        check_out: checkOut,
        nights: price.nights,
        guests: parsedGuests,
        total_amount: price.totalAmount,
        amount_paid: 0,
        currency: PAYMENT_CONFIG.CURRENCY,
        status: "pending",
        razorpay_order_id: order.id,
        special_requests: specialRequests ? String(specialRequests).trim() : null,
        expires_at: expiresAt,
      });

      if (insertError) {
        console.error("[Supabase Bookings Insert Error]:", insertError);
        // Note: We still proceed since Razorpay order was minted, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: price.totalAmount,
      amountPaise: price.amountInPaise,
      currency: PAYMENT_CONFIG.CURRENCY,
      keyId,
      bookingRef,
      accessToken,
      expiresAt,
      breakdown: price,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to initialize payment order.";
    console.error("[Create Order Error]:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
