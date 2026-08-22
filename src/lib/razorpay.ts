import crypto from "crypto";

/**
 * All signature checks use HMAC-SHA256 with the relevant Razorpay secret,
 * compared with a constant-time comparison to avoid timing attacks.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function hmacHex(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verifies the `razorpay_signature` query param Razorpay appends when
 * redirecting the browser back via a Payment Link's callback_url.
 *
 * Per Razorpay's docs (Payment Links APIs → Verify Signature), the payload
 * to sign is:
 *   payment_link_id + "|" + payment_link_reference_id + "|" +
 *   payment_link_status + "|" + razorpay_payment_id
 *
 * IMPORTANT: this confirms the redirect is authentically from Razorpay. It
 * is a UX fast-path only — the webhook (verifyWebhookSignature) remains the
 * authoritative source of truth for entitlement, since a redirect can be
 * dropped, retried, or never fire (e.g. user closes the tab).
 */
export function verifyPaymentLinkCallback(params: {
  paymentLinkId: string;
  paymentLinkReferenceId: string;
  paymentLinkStatus: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const payload = [
    params.paymentLinkId,
    params.paymentLinkReferenceId,
    params.paymentLinkStatus,
    params.razorpayPaymentId,
  ].join("|");

  const expected = hmacHex(payload, secret);
  return safeEqual(expected, params.razorpaySignature);
}

/**
 * Verifies the `X-Razorpay-Signature` header on incoming webhook requests.
 * MUST be computed over the raw, untouched request body — a re-serialized
 * JSON.stringify(JSON.parse(body)) will not reliably match.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = hmacHex(rawBody, secret);
  return safeEqual(expected, signatureHeader);
}

/**
 * Fetches a Payment Link's current state directly from Razorpay's API.
 * Used as a reconciliation fallback (e.g. an admin "resync" action) — not
 * part of the normal webhook flow. Requires RAZORPAY_KEY_ID/SECRET, both
 * server-side only.
 */
export async function fetchPaymentLink(paymentLinkId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Razorpay Payment Links API returned ${res.status}`);
  }

  return res.json();
}
