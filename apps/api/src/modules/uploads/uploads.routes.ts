import { Router } from "express";
import fs from "fs";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, storageConfig } from "../../config/storage";
import { prisma } from "../../db/client";

export const uploadsRouter = Router();

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function validateUpload(req: any): { ok: boolean; error?: string; mime: string; size: number } {
  const mime = req.body?.mimeType || req.headers["content-type"] || "image/jpeg";
  const size = Number(req.body?.byteSize || req.headers["content-length"] || 0);

  const cleanMime = mime.split(";")[0].trim().toLowerCase();
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(cleanMime)) {
    return { ok: false, error: "Invalid mime type; allowed: image/jpeg, image/png, image/webp", mime: cleanMime, size };
  }
  if (size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image exceeds 5MB limit", mime: cleanMime, size };
  }
  return { ok: true, mime: cleanMime, size };
}

// POST /api/v1/uploads/report-image
uploadsRouter.post("/report-image", async (req, res, next) => {
  try {
    const v = validateUpload(req);
    if (!v.ok) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: v.error } });

    const isLocal = process.env.STORAGE_LOCAL === "true" || (process.env.NODE_ENV === "development" && process.env.STORAGE_LOCAL !== "false");
    const ext = v.mime === "image/png" ? "png" : v.mime === "image/webp" ? "webp" : "jpg";
    const objectKey = `reports/${req.session?.userId || "public"}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    if (isLocal) {
      const { saveReportImage } = await import("../../storage/local");

      // Extract real buffer from base64 if provided, or from raw request body
      let dataBuffer: Buffer;
      if (req.body?.base64) {
        const base64Data = req.body.base64.replace(/^data:image\/\w+;base64,/, "");
        dataBuffer = Buffer.from(base64Data, "base64");
      } else if (Buffer.isBuffer(req.body)) {
        dataBuffer = req.body;
      } else {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing image binary payload. Dummy or metadata-only uploads are not permitted.",
          },
        });
      }

      if (dataBuffer.length === 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Image payload is empty. Zero-byte writes are not permitted.",
          },
        });
      }

      if (dataBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Image payload exceeds 5MB limit",
          },
        });
      }

      const detected = detectImageMime(dataBuffer);
      if (!detected || detected !== v.mime) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Image binary content (${detected || "unknown"}) does not match declared mime type (${v.mime}).`,
          },
        });
      }

      const filePath = await saveReportImage(objectKey, dataBuffer);
      const stats = await fs.promises.stat(filePath);

      return res.json({
        data: {
          objectKey,
          filePath,
          bytesWritten: stats.size,
          validated: true,
          maxSizeMB: 5,
          allowedMime: ["image/jpeg", "image/png", "image/webp"],
          storage: "local-development-only",
          url: `/api/v1/uploads/reports/${objectKey}`,
          access: "public-report-image",
        },
      });
    }

    // Production S3 storage: generate presigned PUT upload URL
    try {
      const bucket = storageConfig.reportsBucket;
      const keyId = process.env.S3_ACCESS_KEY_ID || "";
      if (!bucket || !keyId || keyId.includes("replace-") || keyId.includes("dev-local")) {
        return res.status(503).json({
          error: {
            code: "STORAGE_UNAVAILABLE",
            message: "Production S3 credentials not configured. Please configure Cloudflare R2 or AWS S3 credentials.",
          },
        });
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: v.mime,
      });
      const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });

      return res.json({
        data: {
          uploadUrl,
          objectKey,
          storage: "provider-neutral-s3",
          expiresIn: 900,
          headers: { "Content-Type": v.mime },
          access: "public-report-image",
        },
      });
    } catch (err: any) {
      return res.status(503).json({
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: `S3 report image presigning failed: ${err.message}. Ensure S3 credentials and bucket are configured.`,
        },
      });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/uploads/reports/:key(*) — serve public report images from local storage
uploadsRouter.get("/reports/:key(*)", async (req, res, next) => {
  try {
    const objectKey = (req.params as any).key || (req.params as any)[0] || "";
    if (!objectKey) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Key required" } });
    }
    const { getReportImagePath } = await import("../../storage/local");
    const filePath = await getReportImagePath(objectKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Image not found" } });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    res.setHeader("Content-Type", mimeMap[ext] || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/uploads/claim-evidence — upload private evidence
uploadsRouter.post("/claim-evidence", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required to upload claim evidence" } });
    }

    const v = validateUpload(req);
    if (!v.ok) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: v.error } });

    const isLocal = process.env.STORAGE_LOCAL === "true" || (process.env.NODE_ENV === "development" && process.env.STORAGE_LOCAL !== "false");
    const ext = v.mime === "image/png" ? "png" : v.mime === "image/webp" ? "webp" : "jpg";
    const objectKey = `private/claims/${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    if (isLocal) {
      const { saveClaimEvidence } = await import("../../storage/local");

      let dataBuffer: Buffer;
      if (req.body?.base64) {
        const base64Data = req.body.base64.replace(/^data:image\/\w+;base64,/, "");
        dataBuffer = Buffer.from(base64Data, "base64");
      } else if (Buffer.isBuffer(req.body)) {
        dataBuffer = req.body;
      } else {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing image binary payload. Dummy or metadata-only evidence uploads are not permitted.",
          },
        });
      }

      if (dataBuffer.length === 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Evidence payload is empty. Zero-byte writes are not permitted.",
          },
        });
      }

      if (dataBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Evidence payload exceeds 5MB limit",
          },
        });
      }

      const detected = detectImageMime(dataBuffer);
      if (!detected || detected !== v.mime) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Evidence binary content (${detected || "unknown"}) does not match declared mime type (${v.mime}).`,
          },
        });
      }

      const filePath = await saveClaimEvidence(objectKey, dataBuffer);
      const stats = await fs.promises.stat(filePath);

      return res.json({
        data: {
          objectKey,
          filePath,
          bytesWritten: stats.size,
          validated: true,
          privateOnly: true,
          storage: "local-development-only",
          access: "author-and-authorized-reviewer-only",
        },
      });
    }

    // Production S3 storage
    try {
      const bucket = storageConfig.evidenceBucket;
      const keyId = process.env.S3_ACCESS_KEY_ID || "";
      if (!bucket || !keyId || keyId.includes("replace-") || keyId.includes("dev-local")) {
        return res.status(503).json({
          error: {
            code: "STORAGE_UNAVAILABLE",
            message: "Production S3 credentials not configured. Please configure Cloudflare R2 or AWS S3 credentials.",
          },
          privateOnly: true,
        });
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: v.mime,
      });
      const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });

      return res.json({
        data: {
          uploadUrl,
          objectKey,
          storage: "provider-neutral-s3",
          privateOnly: true,
          expiresIn: 900,
          headers: { "Content-Type": v.mime },
          access: "author-and-authorized-reviewer-only",
        },
      });
    } catch (err: any) {
      return res.status(503).json({
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: `Private evidence upload unavailable: ${err.message}`,
        },
        privateOnly: true,
      });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/uploads/claim-evidence/:key(*) — secure server of private claim evidence
uploadsRouter.get("/claim-evidence/:key(*)", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    const role = req.session?.role;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required to view private claim evidence" } });
    }

    const objectKey = (req.params as any).key || (req.params as any)[0] || "";
    if (!objectKey) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Key required" } });
    }

    // Check database to see if the user owns the claim associated with this evidence or is a moderator
    const isModerator = role === "MODERATOR" || role === "ADMIN";
    if (!isModerator) {
      const evidence = await prisma.claimEvidence.findFirst({
        where: { objectKey },
        include: { claim: true },
      });
      if (!evidence || evidence.claim.claimantId !== userId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Access denied: Private claim evidence is only accessible to the claimant and authorized moderators.",
          },
        });
      }
    }

    const { getClaimEvidencePath } = await import("../../storage/local");
    const filePath = await getClaimEvidencePath(objectKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Evidence file not found" } });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    res.setHeader("Content-Type", mimeMap[ext] || "image/jpeg");
    res.setHeader("Cache-Control", "private, no-cache");
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});
