import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

const EXPECTED_AMOUNT_PAISE = Number(process.env.PRODUCT_PRICE_PAISE ?? 50000);
const EXPECTED_CURRENCY = "INR";

/**
 * Handles Razorpay webhooks. This is the authoritative point where a
 * purchase becomes "paid" — the /download page's redirect handling is a UX
 * fast-path only, never a substitute for this.
 *
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://<your-domain>/api/razorpay/webhook
 *   Events: payment_link.paid  (primary)
 *           payment.captured   (fallback safety net)
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    // Wrong or missing signature — never process, never leak why.
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  // Idempotency: Razorpay does not guarantee a stable top-level event id,
  // so key on a hash of the verified raw body. A byte-identical redelivery
  // becomes a safe no-op instead of double-processing.
  const eventId = crypto.createHash("sha256").update(rawBody).digest("hex");

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "malformed json" }, { status: 400 });
  }

  const eventType: string = payload?.event ?? "unknown";

  const alreadyProcessed = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
  if (alreadyProcessed) {
    return NextResponse.json({ status: "already processed" }, { status: 200 });
  }

  try {
    if (eventType === "payment_link.paid") {
      await handlePaymentLinkPaid(payload);
    } else if (eventType === "payment.captured") {
      await handlePaymentCaptured(payload);
    }
    // Other event types are acknowledged but ignored — Razorpay retries on
    // non-200s, so we always 200 once the signature is valid.

    await prisma.webhookEvent.create({ data: { id: eventId, eventType } });
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    // 200 anyway would swallow real bugs; 500 lets Razorpay retry.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

async function handlePaymentLinkPaid(payload: any) {
  const linkEntity = payload?.payload?.payment_link?.entity;
  const paymentEntity = payload?.payload?.payment?.entity;
  if (!linkEntity || !paymentEntity) return;

  const amountPaise = Number(paymentEntity.amount ?? linkEntity.amount_paid ?? 0);
  const currency = String(paymentEntity.currency ?? linkEntity.currency ?? "");

  const amountOk = amountPaise === EXPECTED_AMOUNT_PAISE && currency === EXPECTED_CURRENCY;

  const customer = linkEntity.customer ?? {};

  await prisma.purchase.upsert({
    where: { paymentLinkId: linkEntity.id },
    create: {
      paymentLinkId: linkEntity.id,
      paymentLinkReferenceId: linkEntity.reference_id || null,
      razorpayPaymentId: paymentEntity.id,
      email: customer.email || paymentEntity.email || "unknown@unknown",
      name: customer.name || null,
      phone: customer.contact || paymentEntity.contact || null,
      amountPaise,
      currency,
      status: amountOk ? "paid" : "failed",
      confirmedBy: "webhook",
    },
    update: {
      razorpayPaymentId: paymentEntity.id,
      email: customer.email || paymentEntity.email || undefined,
      name: customer.name || undefined,
      phone: customer.contact || paymentEntity.contact || undefined,
      status: amountOk ? "paid" : "failed",
      confirmedBy: "webhook",
    },
  });

  if (!amountOk) {
    console.error(
      `Amount/currency mismatch for payment_link ${linkEntity.id}: got ${amountPaise} ${currency}, expected ${EXPECTED_AMOUNT_PAISE} ${EXPECTED_CURRENCY}`
    );
  }
}

async function handlePaymentCaptured(payload: any) {
  const paymentEntity = payload?.payload?.payment?.entity;
  if (!paymentEntity) return;

  // If this payment already arrived via payment_link.paid (the common
  // case for our single Payment Button), there's nothing to do — avoid
  // creating a duplicate, reference-less Purchase row.
  const existing = await prisma.purchase.findUnique({
    where: { razorpayPaymentId: paymentEntity.id },
  });
  if (existing) return;

  // No associated payment link on this event — nothing safe to key an
  // entitlement to. Log for manual reconciliation rather than guessing.
  console.warn(
    `payment.captured received with no matching payment_link.paid for payment ${paymentEntity.id}. Manual reconciliation may be needed.`
  );
}
