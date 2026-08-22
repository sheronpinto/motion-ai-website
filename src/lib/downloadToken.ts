import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TTL_SECONDS = Number(process.env.DOWNLOAD_TOKEN_TTL_SECONDS ?? 120);

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a short-lived, single-use download authorization token for a paid
 * purchase. The raw token is returned to the caller exactly once and is
 * never persisted — only its SHA-256 hash is stored, so a database leak
 * alone can't be replayed into a download.
 */
export async function issueDownloadToken(purchaseId: string): Promise<{ token: string; expiresAt: Date }> {
  const raw = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);

  await prisma.downloadToken.create({
    data: {
      tokenHash: hashToken(raw),
      purchaseId,
      expiresAt,
    },
  });

  return { token: raw, expiresAt };
}

export type RedeemResult =
  | { ok: true; purchaseId: string }
  | { ok: false; reason: "not_found" | "expired" | "already_used" };

/**
 * Redeems a download token exactly once. Marking it used and checking
 * expiry happen atomically enough for a single-instance deploy; for
 * multi-instance production, wrap this in a DB transaction with
 * SELECT ... FOR UPDATE or an equivalent conditional update.
 */
export async function redeemDownloadToken(rawToken: string): Promise<RedeemResult> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.downloadToken.findUnique({ where: { tokenHash } });

  if (!record) return { ok: false, reason: "not_found" };
  if (record.usedAt) return { ok: false, reason: "already_used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  // Conditional update: only succeeds if still unused. Guards against a
  // race between two near-simultaneous redemption attempts.
  const result = await prisma.downloadToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (result.count === 0) return { ok: false, reason: "already_used" };

  return { ok: true, purchaseId: record.purchaseId };
}
