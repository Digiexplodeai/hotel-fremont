import "server-only";
import crypto from "crypto";

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
    );
  }

  return { keyId, keySecret };
}

/**
 * Creates an order directly with the Razorpay API.
 * Uses HTTP Basic Authentication with server-only key & secret.
 */
export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret } = getRazorpayCredentials();

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: params.currency || "INR",
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[Razorpay API Error] Status:", response.status, "Receipt:", params.receipt);
    throw new Error(`Razorpay order creation failed: ${response.status} ${response.statusText}`);
  }

  const orderData: RazorpayOrderResponse = await response.json();
  return orderData;
}

/**
 * Verifies Razorpay checkout signature using HMAC SHA256 and timing-safe comparison.
 */
export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  try {
    const { keySecret } = getRazorpayCredentials();
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const a = Buffer.from(expectedSignature, "utf8");
    const b = Buffer.from(signature, "utf8");

    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    console.error("[Razorpay Signature Error] Failed to verify payment signature:", err);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature using x-razorpay-signature and RAZORPAY_WEBHOOK_SECRET.
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn(
        "[Razorpay Webhook Warning] RAZORPAY_WEBHOOK_SECRET is not configured. Webhook signature verification rejected."
      );
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const a = Buffer.from(expectedSignature, "utf8");
    const b = Buffer.from(signature, "utf8");

    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    console.error("[Razorpay Webhook Signature Error]:", err);
    return false;
  }
}
