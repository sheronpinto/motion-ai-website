import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { redeemDownloadToken } from "@/lib/downloadToken";
import { getDownloadDelivery } from "@/lib/storage";
import { isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`download:${ip}`)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Payment verification required." }, { status: 401 });
  }

  const result = await redeemDownloadToken(token);
  if (!result.ok) {
    const messages: Record<string, string> = {
      not_found: "Payment verification required.",
      expired: "This download link has expired. Return to the download page for a new one.",
      already_used: "This download link has already been used. Return to the download page for a new one.",
    };
    return NextResponse.json({ error: messages[result.reason] }, { status: 401 });
  }

  try {
    const delivery = await getDownloadDelivery();

    if (delivery.kind === "redirect") {
      return NextResponse.redirect(delivery.url, { status: 302 });
    }

    // Local-disk streaming path. Filename is fixed server-side config —
    // never derived from user input — so there is no traversal surface.
    const stat = fs.statSync(delivery.filePath);
    const stream = fs.createReadStream(delivery.filePath);

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${delivery.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Download delivery error:", err);
    return NextResponse.json(
      { error: "Download is temporarily unavailable. Contact support with your payment ID." },
      { status: 500 }
    );
  }
}
