import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyStandardCheckoutSignature } from "@/lib/razorpay";
import { standardCheckoutVerifySchema } from "@/lib/schemas";
import { createPurchaseSession, PURCHASE_SESSION_COOKIE } from "@/lib/purchaseSession";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const parsed = standardCheckoutVerifySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment response" }, { status: 400 });

    const params = parsed.data;
    const purchase = await prisma.purchase.findUnique({ where: { razorpayOrderId: params.razorpay_order_id } });
    if (!purchase || !verifyStandardCheckoutSignature({
      orderId: purchase.razorpayOrderId!,
      paymentId: params.razorpay_payment_id,
      signature: params.razorpay_signature,
    })) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { razorpayPaymentId: params.razorpay_payment_id, status: purchase.status === "paid" ? "paid" : "awaiting_capture", confirmedBy: "checkout+webhook" },
    });

    const response = NextResponse.json({ status: "verified" });
    response.cookies.set(PURCHASE_SESSION_COOKIE, createPurchaseSession(purchase.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
    return response;
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Payment verification is temporarily unavailable" }, { status: 503 });
  }
}