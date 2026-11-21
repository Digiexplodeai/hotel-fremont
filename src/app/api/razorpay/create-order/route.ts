import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { DEFAULT_ROOM_TYPES, HOTEL_CONFIG, validateIndianPhone, RoomTypeConfig } from "@/config/hotel";
import { calculateServerBookingPrice, PAYMENT_CONFIG, MealPlan, Occupancy } from "@/lib/payment-config";
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
      guests = 2,
      mealPlan = "without_breakfast",
      occupancy = "double",
      roomOccupancies,
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

    // 3. Fetch active Room Types from Supabase
    const supabase = createAdminSupabaseClient();
    let roomTypes: RoomTypeConfig[] = DEFAULT_ROOM_TYPES;

    if (supabase) {
      const { data: dbRoomTypes } = await supabase
        .from("room_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (dbRoomTypes && dbRoomTypes.length > 0) {
        roomTypes = dbRoomTypes.map((row: any) => ({
          code: row.code,
          slug: row.slug || row.code,
          name: row.name,
          pricePerNight: Number(row.price_per_night || 2299),
          totalRooms: Number(row.rooms_total || row.total_rooms || 1),
          roomsTotal: Number(row.rooms_total || row.total_rooms || 1),
          maxGuests: Number(row.max_guests || 2),
          isActive: Boolean(row.is_active !== false),
          sortOrder: Number(row.sort_order || 0),
          rateCpDouble: row.rate_cp_double ? Number(row.rate_cp_double) : undefined,
          rateCpSingle: row.rate_cp_single ? Number(row.rate_cp_single) : undefined,
          rateEpDouble: row.rate_ep_double ? Number(row.rate_ep_double) : undefined,
          rateEpSingle: row.rate_ep_single ? Number(row.rate_ep_single) : undefined,
        }));
      }
    }

    const room = roomTypes.find(
      (r) =>
        r.code.toLowerCase() === (roomCategory || "").toLowerCase() ||
        r.slug?.toLowerCase() === (roomCategory || "").toLowerCase() ||
        r.name.toLowerCase() === (roomCategory || "").toLowerCase()
    );

    if (!room) {
      return NextResponse.json(
        { success: false, error: `Invalid room category: ${roomCategory}` },
        { status: 400 }
      );
    }

    const totalCategoryRooms = room.roomsTotal || room.totalRooms || 21;
    const parsedRooms = Math.max(1, parseInt(String(roomsRequested), 10) || 1);
    if (parsedRooms > totalCategoryRooms) {
      return NextResponse.json(
        { success: false, error: `Only ${totalCategoryRooms} rooms exist for ${room.name}.` },
        { status: 400 }
      );
    }

    const maxGuestsAllowed = parsedRooms * (room.maxGuests || 2);
    const parsedGuests = Math.max(1, parseInt(String(guests), 10) || 1);
    if (parsedGuests > maxGuestsAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `${parsedRooms} ${room.name} can accommodate up to ${maxGuestsAllowed} guests (max ${room.maxGuests || 2} per room).`,
        },
        { status: 400 }
      );
    }

    // 4. Supabase verification & Concurrency Check
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

      // Check overlapping active bookings (paid or unexpired pending)
      const { data: overlappingBookings } = await supabase
        .from("bookings")
        .select("rooms_requested, rooms_count, check_in, check_out, status, expires_at")
        .or(`room_category.eq.${room.code},room_category.eq.${room.slug || room.code}`)
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

      const activeBookings = (overlappingBookings || []).filter((b) => {
        if (b.status === "paid") return true;
        if (b.status === "pending" && b.expires_at && new Date(b.expires_at) > new Date()) return true;
        return false;
      });

      // Calculate max occupied rooms on any night during stay
      const occupancyByDate: Record<string, number> = {};

      for (const item of [...activeBookings, ...(overlappingReservations || [])]) {
        const itemStart = new Date(item.check_in);
        const itemEnd = new Date(item.check_out);
        const bookedCount = Number((item as any).rooms_count || item.rooms_requested || 1);

        for (let d = new Date(itemStart); d < itemEnd; d.setDate(d.getDate() + 1)) {
          const dKey = d.toISOString().slice(0, 10);
          if (dKey >= checkIn && dKey < checkOut) {
            occupancyByDate[dKey] = (occupancyByDate[dKey] || 0) + bookedCount;
          }
        }
      }

      const peakOccupied = Math.max(0, ...Object.values(occupancyByDate));
      const roomsRemaining = Math.max(0, totalCategoryRooms - peakOccupied);

      if (peakOccupied + parsedRooms > totalCategoryRooms) {
        return NextResponse.json(
          {
            success: false,
            error: `Apologies, only ${roomsRemaining} room(s) available for ${room.name} on the selected dates.`,
          },
          { status: 409 }
        );
      }
    }

    // 5. Calculate server-side price (strictly tamper-proof)
    const price = calculateServerBookingPrice(
      room.code,
      checkIn,
      checkOut,
      parsedRooms,
      mealPlan as MealPlan,
      occupancy as Occupancy,
      roomTypes,
      Array.isArray(roomOccupancies) ? roomOccupancies : undefined
    );

    // 6. Generate secure identifiers
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const bookingRef = `${HOTEL_CONFIG.refCodePrefix}${randomSuffix}`; // e.g. FRM-A1B2C3
    const accessToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + PAYMENT_CONFIG.HOLD_MINUTES * 60 * 1000).toISOString();

    // 7. Create Razorpay order
    const { keyId } = getRazorpayCredentials();
    const orderNotes: Record<string, string> = {
      bookingRef,
      guestName: guestName.trim(),
      phone: phoneValidation.cleanPhone,
      email: email.trim().toLowerCase(),
      roomCategory: room.code,
      checkIn,
      checkOut,
      roomsRequested: String(parsedRooms),
      guests: String(parsedGuests),
      mealPlan: price.mealPlan,
      occupancy: price.occupancy,
    };
    if (Array.isArray(roomOccupancies) && roomOccupancies.length > 0) {
      orderNotes.roomOccupancies = JSON.stringify(roomOccupancies);
    }

    const order = await createRazorpayOrder({
      amountPaise: price.amountInPaise,
      currency: PAYMENT_CONFIG.CURRENCY,
      receipt: bookingRef,
      notes: orderNotes,
    });

    // 8. Store pending booking in Supabase
    if (supabase) {
      const { error: insertError } = await supabase.from("bookings").insert({
        booking_ref: bookingRef,
        access_token: accessToken,
        guest_name: guestName.trim(),
        phone: phoneValidation.cleanPhone,
        email: email.trim().toLowerCase(),
        room_category: room.code,
        rooms_requested: parsedRooms,
        rooms_count: parsedRooms,
        check_in: checkIn,
        check_out: checkOut,
        nights: price.nights,
        guests: parsedGuests,
        meal_plan: price.mealPlan,
        occupancy: price.occupancy,
        rate_per_night: price.ratePerNight,
        base_amount: price.baseAmount,
        gst_percent: price.gstPercent,
        gst_amount: price.gstAmount,
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
