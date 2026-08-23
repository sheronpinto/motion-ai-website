import crypto from "crypto";

const COOKIE_NAME = "motion_purchase_session";

function signature(purchaseId: string): string {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!secret) throw new Error("DOWNLOAD_TOKEN_SECRET is not configured");
  return crypto.createHmac("sha256", secret).update(purchaseId).digest("base64url");
}

export function createPurchaseSession(purchaseId: string): string {
  return `${purchaseId}.${signature(purchaseId)}`;
}

export function readPurchaseSession(value: string | undefined): string | null {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;

  const purchaseId = value.slice(0, separator);
  const provided = value.slice(separator + 1);
  const expected = signature(purchaseId);
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return null;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer) ? purchaseId : null;
}

export { COOKIE_NAME as PURCHASE_SESSION_COOKIE };