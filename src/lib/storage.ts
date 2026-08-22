import fs from "fs";
import path from "path";

/**
 * Abstracts "where the customer ZIP actually lives" behind one function so
 * swapping local disk for Cloudflare R2 / S3 is a config change, not a
 * code change. Neither path ever returns a permanent public URL — local
 * mode streams bytes through this server, s3 mode returns a presigned URL
 * that expires quickly.
 */

export type DownloadDelivery =
  | { kind: "stream"; filePath: string; filename: string }
  | { kind: "redirect"; url: string };

export async function getDownloadDelivery(): Promise<DownloadDelivery> {
  const provider = process.env.DOWNLOAD_STORAGE_PROVIDER ?? "local";

  if (provider === "local") {
    const filePath = process.env.LOCAL_DOWNLOAD_PATH;
    if (!filePath) throw new Error("LOCAL_DOWNLOAD_PATH is not configured");

    // Defense in depth: even though the path comes from server config (not
    // user input), reject anything that isn't an absolute, normalized path
    // to catch misconfiguration before it becomes a traversal bug.
    const resolved = path.resolve(filePath);
    if (resolved !== filePath || !fs.existsSync(resolved)) {
      throw new Error("Configured download file is missing or path is not absolute");
    }

    const filename = process.env.LOCAL_DOWNLOAD_FILENAME || path.basename(resolved);
    return { kind: "stream", filePath: resolved, filename };
  }

  if (provider === "s3") {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const bucket = process.env.S3_BUCKET;
    const key = process.env.S3_OBJECT_KEY;
    const region = process.env.S3_REGION || "auto";
    const endpoint = process.env.S3_ENDPOINT; // set for R2 / non-AWS S3-compatible stores
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!bucket || !key || !accessKeyId || !secretAccessKey) {
      throw new Error("S3 storage is selected but S3_* environment variables are incomplete");
    }

    const client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    // Short expiry — this is on top of, not instead of, the download
    // token's own short lifetime.
    const url = await getSignedUrl(client, command, { expiresIn: 90 });

    return { kind: "redirect", url };
  }

  throw new Error(`Unknown DOWNLOAD_STORAGE_PROVIDER: ${provider}`);
}
