import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymentLinkCallback } from "@/lib/razorpay";
import { paymentLinkCallbackSchema } from "@/lib/schemas";
import { issueDownloadToken } from "@/lib/downloadToken";

export const runtime = "nodejs";

/**
 * Called by the /download page (client-side) with the query params
 * Razorpay attached to the redirect. This endpoint:
 *
 *  1. Verifies the razorpay_signature — proves the request is genuinely
 *     from Razorpay and refers to a specific payment_link_id, not just a
 *     browser claiming "it worked."
 *  2. Looks up whether the webhook has already marked that payment_link as
 *     paid (the authoritative record).
 *  3. If paid, issues a short-lived, single-use download token.
 *
 * If the webhook hasn't landed yet, this returns "pending" and the client
 * polls again shortly — it never fabricates a "paid" result from the
 * redirect alone.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = paymentLinkCallbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ status: "invalid_request" }, { status: 400 });
  }

  const params = parsed.data;

  const signatureValid = verifyPaymentLinkCallback({
    paymentLinkId: params.razorpay_payment_link_id,
    paymentLinkReferenceId: params.razorpay_payment_link_reference_id,
    paymentLinkStatus: params.razorpay_payment_link_status,
    razorpayPaymentId: params.razorpay_payment_id,
    razorpaySignature: params.razorpay_signature,
  });

  if (!signatureValid) {
    return NextResponse.json({ status: "invalid_signature" }, { status: 400 });
  }

  const purchase = await prisma.purchase.findFirst({
    where: {
      OR: [
        { paymentLinkId: params.razorpay_payment_link_id },
        { razorpayPaymentId: params.razorpay_payment_id },
      ],
    },
  });

  if (!purchase || purchase.status !== "paid") {
    // Signature is genuine but the authoritative webhook record isn't in
    // yet (or the payment failed/was partial). Client should poll.
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }

  const { token, expiresAt } = await issueDownloadToken(purchase.id);

  return NextResponse.json({
    status: "paid",
    downloadToken: token,
    expiresInSeconds: Math.round((expiresAt.getTime() - Date.now()) / 1000),
  });
}
