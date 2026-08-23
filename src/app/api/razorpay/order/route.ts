import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";
import { createOrderSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const AMOUNT_PAISE = Number(process.env.PRODUCT_PRICE_PAISE ?? 50000);

export async function POST(req: NextRequest) {
  try {
    const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid customer details" }, { status: 400 });

    if (!Number.isInteger(AMOUNT_PAISE) || AMOUNT_PAISE <= 0) {
      console.error("PRODUCT_PRICE_PAISE is invalid");
      return NextResponse.json({ error: "Payment configuration is invalid" }, { status: 500 });
    }

    const purchase = await prisma.purchase.create({
      data: {
        email: parsed.data.email || "unknown@unknown",
        name: parsed.data.name || null,
        phone: parsed.data.contact || null,
        amountPaise: AMOUNT_PAISE,
        currency: "INR",
      },
    });

    const order = await createRazorpayOrder({
      amount: AMOUNT_PAISE,
      currency: "INR",
      receipt: purchase.id,
    });

    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { razorpayOrderId: order.id },
    });

    return NextResponse.json({
      order_id: order.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: AMOUNT_PAISE,
      currency: "INR",
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 502 });
  }
}