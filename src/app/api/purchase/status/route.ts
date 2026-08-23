import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueDownloadToken } from "@/lib/downloadToken";
import { readPurchaseSession, PURCHASE_SESSION_COOKIE } from "@/lib/purchaseSession";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  let purchaseId: string | null = null;
  try {
    purchaseId = readPurchaseSession(req.cookies.get(PURCHASE_SESSION_COOKIE)?.value);
  } catch {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }
  if (!purchaseId) return NextResponse.json({ status: "unauthorized" }, { status: 401 });

  try {
    const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase || purchase.status === "failed" || purchase.status === "cancelled") {
      return NextResponse.json({ status: "unauthorized" }, { status: 401 });
    }
    if (purchase.status !== "paid") return NextResponse.json({ status: "pending" }, { status: 202 });

    const { token, expiresAt } = await issueDownloadToken(purchase.id);
    return NextResponse.json({
      status: "paid",
      downloadToken: token,
      expiresInSeconds: Math.round((expiresAt.getTime() - Date.now()) / 1000),
    });
  } catch (error) {
    console.error("Purchase status lookup failed:", error);
    return NextResponse.json({ error: "Payment status is temporarily unavailable" }, { status: 503 });
  }
}