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
    if (eventType === "payment.captured") {
      await handlePaymentCaptured(payload);
    } else if (eventType === "order.paid") {
      await handleOrderPaid(payload);
    } else if (eventType === "payment.failed") {
      await handlePaymentFailed(payload);
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

  const amountPaise = Number(paymentEntity.amount ?? 0);
  const currency = String(paymentEntity.currency ?? "");
  const amountOk = amountPaise === EXPECTED_AMOUNT_PAISE && currency === EXPECTED_CURRENCY;
  const purchase = paymentEntity.order_id
    ? await prisma.purchase.findUnique({ where: { razorpayOrderId: paymentEntity.order_id } })
    : null;
  if (!purchase) {
    console.warn(`Captured payment ${paymentEntity.id} has no matching server order`);
    return;
  }

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { razorpayPaymentId: paymentEntity.id, status: amountOk ? "paid" : "failed", confirmedBy: "webhook" },
  });

  if (!amountOk) {
    console.error(
      `Amount/currency mismatch for payment ${paymentEntity.id}: got ${amountPaise} ${currency}, expected ${EXPECTED_AMOUNT_PAISE} ${EXPECTED_CURRENCY}`
    );
  }
}

async function handleOrderPaid(payload: any) {
  const order = payload?.payload?.order?.entity;
  if (!order?.id) return;

  const purchase = await prisma.purchase.findUnique({ where: { razorpayOrderId: order.id } });
  if (!purchase) {
    console.warn(`Paid order ${order.id} has no matching server order`);
    return;
  }

  const amountOk = Number(order.amount) === EXPECTED_AMOUNT_PAISE && String(order.currency) === EXPECTED_CURRENCY;
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: amountOk ? "paid" : "failed", confirmedBy: "webhook" },
  });
}

async function handlePaymentFailed(payload: any) {
  const payment = payload?.payload?.payment?.entity;
  if (!payment?.order_id) return;
  await prisma.purchase.updateMany({
    where: { razorpayOrderId: payment.order_id, status: { not: "paid" } },
    data: { razorpayPaymentId: payment.id, status: "failed", confirmedBy: "webhook" },
  });
}
