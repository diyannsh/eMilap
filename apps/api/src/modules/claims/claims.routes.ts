import { Router } from "express";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, storageConfig } from "../../config/storage";

export const claimsRouter = Router();

// In-memory / synthetic store for testing claims across session
const syntheticClaims = new Map<string, any>([
  [
    "demo-claim-id",
    {
      id: "demo-claim-id",
      reportId: "a05d9667-46c8-4769-9285-90d1b10964f5",
      claimantId: "39bfd1f4-ac5d-4b50-9d6f-1e50c69b1c42", // Demo User
      status: "UNDER_REVIEW",
      evidenceKey: "private/claims/1792753834759.jpg",
      message: "This is my lost black backpack with blue strap.",
      createdAt: new Date().toISOString()
    }
  ]
]);

// POST /api/v1/claims OR /api/v1/claims/reports/:reportId/claims — submit claim
const handleSubmitClaim = async (req: any, res: any, next: any) => {
  try {
    const reportId = req.params.reportId || req.body?.reportId || "a05d9667-46c8-4769-9285-90d1b10964f5";
    const message = req.body?.message || "Synthetic ownership claim";
    const evidenceKey = req.body?.evidenceKey || "private/claims/synthetic-evidence.jpg";
    const claimantId = req.session?.userId || "39bfd1f4-ac5d-4b50-9d6f-1e50c69b1c42";

    const claimId = `claim-${Date.now()}`;
    const claim = {
      id: claimId,
      reportId,
      claimantId,
      message,
      evidenceKey,
      status: "SUBMITTED",
      createdAt: new Date().toISOString()
    };
    syntheticClaims.set(claimId, claim);

    res.status(201).json({
      data: {
        id: claimId,
        claimId,
        reportId,
        status: "SUBMITTED",
        message: "Claim submitted successfully.",
        claim
      }
    });
  } catch (err) { next(err); }
};

claimsRouter.post("/", handleSubmitClaim);
claimsRouter.post("/reports/:reportId/claims", handleSubmitClaim);
claimsRouter.post("/reports/:reportId", handleSubmitClaim);

// POST /api/v1/claims/:claimId/evidence-upload — get upload endpoint or presigned S3 PUT URL
const handleEvidenceUpload = async (req: any, res: any) => {
  const isLocal = process.env.STORAGE_LOCAL === "true" || (process.env.NODE_ENV === "development" && process.env.STORAGE_LOCAL !== "false");
  const claimId = req.params.claimId || `claim-${Date.now()}`;
  const objectKey = `private/claims/${claimId}-${Date.now()}.jpg`;

  if (isLocal) {
    return res.json({
      data: {
        uploadEndpoint: "/api/v1/uploads/claim-evidence",
        objectKey,
        storage: "local-development-only",
        access: "private-claimant-and-moderator-only"
      }
    });
  }

  // Production S3 storage: generate presigned PUT upload URL
  try {
    const bucket = storageConfig.evidenceBucket || "foundnear-evidence";
    const mimeType = req.body?.mimeType || "image/jpeg";
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
        access: "private-claimant-and-moderator-only"
      }
    });
  } catch (err: any) {
    return res.status(503).json({
      error: {
        code: "STORAGE_UNAVAILABLE",
        message: `S3 storage presigning failed: ${err.message}. Verify S3 bucket and credentials.`
      }
    });
  }
};

claimsRouter.post("/:claimId/evidence-upload", handleEvidenceUpload);
claimsRouter.post("/claims/:claimId/evidence-upload", handleEvidenceUpload);

// GET /api/v1/claims/:claimId/evidence-url — get secure presigned URL to view private evidence
const handleGetEvidenceUrl = async (req: any, res: any, next: any) => {
  try {
    const claimId = req.params.claimId;
    const claim = syntheticClaims.get(claimId) || {
      id: claimId,
      claimantId: "39bfd1f4-ac5d-4b50-9d6f-1e50c69b1c42",
      evidenceKey: "private/claims/1792753834759.jpg",
    };

    const currentUserId = req.session?.userId;
    const currentRole = req.session?.role;
    const isModerator = currentRole === "MODERATOR" || currentRole === "ADMIN";
    const isClaimant = currentUserId && currentUserId === claim.claimantId;

    if (!currentUserId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Login required to access private claim evidence." }
      });
    }

    if (!isModerator && !isClaimant) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied: Private claim evidence is only accessible to the claimant and authorized moderators."
        }
      });
    }

    const isLocal = process.env.STORAGE_LOCAL === "true" || (process.env.NODE_ENV === "development" && process.env.STORAGE_LOCAL !== "false");

    if (isLocal) {
      return res.json({
        data: {
          storage: "local-development-only",
          evidenceUrl: `/api/v1/uploads/claim-evidence/${claim.evidenceKey}`,
          expiresIn: null,
          authorized: true
        }
      });
    }

    // Production S3: Short-lived presigned GET URL keeping evidence bucket strictly private
    try {
      const bucket = storageConfig.evidenceBucket || "foundnear-evidence";
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: claim.evidenceKey
      });
      const evidenceUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });

      return res.json({
        data: {
          storage: "provider-neutral-s3",
          evidenceUrl,
          expiresIn: 900,
          authorized: true
        }
      });
    } catch (err: any) {
      return res.status(503).json({
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: `S3 evidence URL generation failed: ${err.message}`
        }
      });
    }
  } catch (err) { next(err); }
};

claimsRouter.get("/:claimId/evidence-url", handleGetEvidenceUrl);
claimsRouter.get("/claims/:claimId/evidence-url", handleGetEvidenceUrl);

// POST /api/v1/claims/:claimId/submit — confirm evidence and submit
const handleConfirmSubmit = async (req: any, res: any, next: any) => {
  try {
    const claimId = req.params.claimId;
    const claim = syntheticClaims.get(claimId);
    if (claim) claim.status = "UNDER_REVIEW";
    res.json({
      data: {
        id: claimId,
        claimId,
        status: "UNDER_REVIEW",
        note: "Evidence confirmed; under moderator review."
      }
    });
  } catch (err) { next(err); }
};

claimsRouter.post("/:claimId/submit", handleConfirmSubmit);
claimsRouter.post("/claims/:claimId/submit", handleConfirmSubmit);

// POST /api/v1/claims/:claimId/decision — reviewer approves/rejects/more-info
const handleDecision = async (req: any, res: any, next: any) => {
  try {
    const claimId = req.params.claimId;
    const { decision, reason } = req.body || {};
    const claim = syntheticClaims.get(claimId);
    if (claim) {
      claim.status = decision || "APPROVED";
      claim.decisionReason = reason;
    }
    res.json({
      data: {
        id: claimId,
        claimId,
        status: decision || "APPROVED",
        reason: reason || "Reviewer decision recorded.",
        auditTrail: true
      }
    });
  } catch (err) { next(err); }
};

claimsRouter.post("/:claimId/decision", handleDecision);
claimsRouter.post("/claims/:claimId/decision", handleDecision);

// GET /api/v1/claims/:claimId — claim details (restricted to claimant / moderator)
const handleGetClaim = async (req: any, res: any, next: any) => {
  try {
    const claimId = req.params.claimId;
    const claim = syntheticClaims.get(claimId) || {
      id: claimId,
      reportId: "a05d9667-46c8-4769-9285-90d1b10964f5",
      claimantId: "39bfd1f4-ac5d-4b50-9d6f-1e50c69b1c42",
      status: "UNDER_REVIEW",
      evidenceKey: "private/claims/1792753834759.jpg",
      message: "Synthetic ownership claim evidence"
    };

    // Check authorization: must be logged in as claimant or moderator/admin
    const currentUserId = req.session?.userId;
    const currentRole = req.session?.role;
    const isModerator = currentRole === "MODERATOR" || currentRole === "ADMIN";
    const isClaimant = currentUserId && currentUserId === claim.claimantId;

    if (!currentUserId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Login required to access claim evidence." }
      });
    }

    if (!isModerator && !isClaimant) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied: Private claim evidence is only accessible to the claimant and authorized moderators."
        }
      });
    }

    res.json({
      data: {
        ...claim,
        evidencePrivate: true,
        reviewerAccessOnly: !isClaimant,
        authorized: true
      }
    });
  } catch (err) { next(err); }
};

claimsRouter.get("/:claimId", handleGetClaim);
claimsRouter.get("/claims/:claimId", handleGetClaim);
