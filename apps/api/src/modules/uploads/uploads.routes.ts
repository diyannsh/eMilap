import { Router } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, storageConfig } from "../../config/storage";

export const uploadsRouter = Router();

function validateUpload(req: any): { ok: boolean; error?: string } {
  const mime = req.body?.mimeType || req.query?.mime;
  const size = req.body?.byteSize || req.query?.size;
  if (!mime || !["image/jpeg", "image/png", "image/webp"].includes(mime)) {
    return { ok: false, error: "Invalid mime type; allowed: image/jpeg, image/png, image/webp" };
  }
  if (size && Number(size) > 5 * 1024 * 1024) {
    return { ok: false, error: "Image exceeds 5MB limit" };
  }
  return { ok: true };
}

uploadsRouter.post("/report-image", async (req, res, next) => {
  try {
    const v = validateUpload(req);
    if (!v.ok) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: v.error } });

    const isLocal = process.env.STORAGE_LOCAL === "true" || (process.env.NODE_ENV === "development" && process.env.STORAGE_LOCAL !== "false");
    const mimeType = req.body?.mimeType || "image/jpeg";
    const objectKey = `reports/${req.session?.userId || "anon"}/${Date.now()}.jpg`;

    if (isLocal) {
      const { saveReportImage } = await import("../../storage/local");
      const filePath = await saveReportImage(objectKey, Buffer.from("dev-local-file-content"));
      return res.json({
        data: {
          objectKey,
          filePath,
          validated: true,
          maxSizeMB: 5,
          allowedMime: ["image/jpeg", "image/png", "image/webp"],
          storage: "local-development-only",
          access: "author-authorized-only"
        }
      });
    }

    // Production S3 storage: generate presigned PUT upload URL
    try {
      const bucket = storageConfig.reportsBucket || "foundnear-reports";
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: mimeType,
      });
      const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });

      return res.json({
        data: {
          uploadUrl,
          objectKey,
          storage: "provider-neutral-s3",
          expiresIn: 900,
          headers: { "Content-Type": mimeType },
          access: "author-authorized-only"
        }
      });
    } catch (err: any) {
      return res.status(503).json({
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: `S3 report image presigning failed: ${err.message}. Ensure S3 credentials and bucket are configured.`
        }
      });
    }
  } catch (err) { next(err); }
});

uploadsRouter.post("/claim-evidence", async (req, res, next) => {
  try {
    const v = validateUpload(req);
    if (!v.ok) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: v.error } });

    const isLocal = process.env.STORAGE_LOCAL === "true" || (process.env.NODE_ENV === "development" && process.env.STORAGE_LOCAL !== "false");
    const mimeType = req.body?.mimeType || "image/jpeg";
    const objectKey = `private/claims/${Date.now()}.jpg`;

    if (isLocal) {
      const { saveClaimEvidence } = await import("../../storage/local");
      const filePath = await saveClaimEvidence(objectKey, Buffer.from("dev-local-evidence"));
      return res.json({
        data: {
          objectKey,
          filePath,
          validated: true,
          privateOnly: true,
          storage: "local-development-only",
          access: "author-and-authorized-reviewer-only"
        }
      });
    }

    // Production S3 storage: generate presigned PUT upload URL keeping evidence bucket private
    try {
      const bucket = storageConfig.evidenceBucket || "foundnear-evidence";
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: mimeType,
      });
      const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });

      return res.json({
        data: {
          uploadUrl,
          objectKey,
          storage: "provider-neutral-s3",
          privateOnly: true,
          expiresIn: 900,
          headers: { "Content-Type": mimeType },
          access: "author-and-authorized-reviewer-only"
        }
      });
    } catch (err: any) {
      return res.status(503).json({
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: `Private evidence upload unavailable: ${err.message}. Ensure S3_BUCKET_EVIDENCE and credentials are set.`
        },
        privateOnly: true
      });
    }
  } catch (err) { next(err); }
});
