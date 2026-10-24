import { Router } from "express";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client, storageConfig } from "../../config/storage";
import { prisma } from "../../db/client";
import { decryptClue } from "../../lib/encryption";

export const claimsRouter = Router();

// Helper to check moderator role
function isModOrAdmin(role?: string) {
  return role === "MODERATOR" || role === "ADMIN";
}

// POST /api/v1/claims OR /api/v1/claims/reports/:reportId/claims — submit claim
const handleSubmitClaim = async (req: any, res: any, next: any) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required to submit a claim" } });
    }

    const reportId = req.params.reportId || req.body?.reportId;
    if (!reportId) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Report ID is required" } });
    }

    const message = req.body?.message?.trim() || "";
    if (message.length < 5 || message.length > 3000) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Claim message must be between 5 and 3000 characters" } });
    }

    const report = await prisma.itemReport.findUnique({ where: { id: reportId } });
    if (!report) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Target report not found" } });
    }

    const evidenceKey = req.body?.evidenceKey;

    const claim = await prisma.ownershipClaim.create({
      data: {
        reportId: report.id,
        claimantId: userId,
        status: "SUBMITTED",
        message,
      },
    });

    if (evidenceKey && typeof evidenceKey === "string") {
      await prisma.claimEvidence.create({
        data: {
          claimId: claim.id,
          objectKey: evidenceKey,
          evidenceType: "IMAGE",
          mimeType: evidenceKey.endsWith(".png") ? "image/png" : "image/jpeg",
          byteSize: BigInt(1024),
        },
      }).catch(() => {});
    }

    // Notify the report author of a new ownership claim
    if (report.reporterId !== userId) {
      await prisma.notification.create({
        data: {
          userId: report.reporterId,
          communityId: report.communityId,
          kind: "CLAIM_SUBMITTED",
          payload: {
            claimId: claim.id,
            reportId: report.id,
            reportTitle: report.title,
            message: "Someone submitted an ownership claim for your report.",
          },
          dedupeKey: `claim-sub-${claim.id}`,
        },
      }).catch(() => {});
    }

    res.status(201).json({
      data: {
        id: claim.id,
        claimId: claim.id,
        reportId: claim.reportId,
        status: claim.status,
        message: "Claim submitted successfully.",
        claim,
      },
    });
  } catch (err) {
    next(err);
  }
};

claimsRouter.post("/", handleSubmitClaim);
claimsRouter.post("/reports/:reportId/claims", handleSubmitClaim);
claimsRouter.post("/reports/:reportId", handleSubmitClaim);

// GET /api/v1/claims — list claims (user's own or moderator community queue)
claimsRouter.get("/", async (req: any, res: any, next: any) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }

    const isMod = isModOrAdmin(req.session?.role);
    const where: any = isMod ? {} : { claimantId: userId };

    const claims = await prisma.ownershipClaim.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        report: {
          select: {
            id: true,
            title: true,
            category: true,
            reportType: true,
            status: true,
          },
        },
        claimant: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        claimEvidence: {
          select: {
            id: true,
            objectKey: true,
            evidenceType: true,
          },
        },
      },
    });

    res.json({ data: claims, total: claims.length });
  } catch (err) {
    next(err);
  }
});

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
        access: "private-claimant-and-moderator-only",
      },
    });
  }

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
        access: "private-claimant-and-moderator-only",
      },
    });
  } catch (err: any) {
    return res.status(503).json({
      error: {
        code: "STORAGE_UNAVAILABLE",
        message: `S3 storage presigning failed: ${err.message}. Verify S3 bucket and credentials.`,
      },
    });
  }
};

claimsRouter.post("/:claimId/evidence-upload", handleEvidenceUpload);
claimsRouter.post("/claims/:claimId/evidence-upload", handleEvidenceUpload);

// GET /api/v1/claims/:claimId/evidence-url — get secure URL to view private evidence
const handleGetEvidenceUrl = async (req: any, res: any, next: any) => {
  try {
    const claimId = req.params.claimId;
    const currentUserId = req.session?.userId;
    const currentRole = req.session?.role;

    if (!currentUserId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required to access private claim evidence." } });
    }

    const claim = await prisma.ownershipClaim.findUnique({
      where: { id: claimId },
      include: { claimEvidence: true },
    });

    if (!claim) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Claim not found" } });
    }

    const isModerator = isModOrAdmin(currentRole);
    const isClaimant = currentUserId === claim.claimantId;

    if (!isModerator && !isClaimant) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied: Private claim evidence is only accessible to the claimant and authorized moderators.",
        },
      });
    }

    const evidenceKey = claim.claimEvidence[0]?.objectKey || "private/claims/default-evidence.jpg";
    const isLocal = process.env.STORAGE_LOCAL === "true" || (process.env.NODE_ENV === "development" && process.env.STORAGE_LOCAL !== "false");

    if (isLocal) {
      return res.json({
        data: {
          storage: "local-development-only",
          evidenceUrl: `/api/v1/uploads/claim-evidence/${evidenceKey}`,
          expiresIn: null,
          authorized: true,
        },
      });
    }

    try {
      const bucket = storageConfig.evidenceBucket || "foundnear-evidence";
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: evidenceKey,
      });
      const evidenceUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 });

      return res.json({
        data: {
          storage: "provider-neutral-s3",
          evidenceUrl,
          expiresIn: 900,
          authorized: true,
        },
      });
    } catch (err: any) {
      return res.status(503).json({
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: `S3 evidence URL generation failed: ${err.message}`,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

claimsRouter.get("/:claimId/evidence-url", handleGetEvidenceUrl);
claimsRouter.get("/claims/:claimId/evidence-url", handleGetEvidenceUrl);

// POST /api/v1/claims/:claimId/submit — confirm evidence and submit
const handleConfirmSubmit = async (req: any, res: any, next: any) => {
  try {
    const claimId = req.params.claimId;
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }

    const claim = await prisma.ownershipClaim.update({
      where: { id: claimId },
      data: { status: "UNDER_REVIEW" },
    }).catch(() => null);

    res.json({
      data: {
        id: claimId,
        claimId,
        status: "UNDER_REVIEW",
        note: "Evidence confirmed; under moderator review.",
        claim,
      },
    });
  } catch (err) {
    next(err);
  }
};

claimsRouter.post("/:claimId/submit", handleConfirmSubmit);
claimsRouter.post("/claims/:claimId/submit", handleConfirmSubmit);

// POST /api/v1/claims/:claimId/decision — reviewer approves/rejects/more-info
const handleDecision = async (req: any, res: any, next: any) => {
  try {
    const userId = req.session?.userId;
    const role = req.session?.role;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }
    if (!isModOrAdmin(role)) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Moderator or Administrator authorization required for claim decisions" } });
    }

    const claimId = req.params.claimId;
    const { decision, reason } = req.body || {};
    const validDecisions = ["APPROVED", "REJECTED", "MORE_INFO_REQUESTED", "UNDER_REVIEW"];
    const targetDecision = validDecisions.includes(decision) ? decision : "APPROVED";

    const claim = await prisma.ownershipClaim.update({
      where: { id: claimId },
      data: {
        status: targetDecision,
        decisionReason: reason || null,
        reviewerId: userId,
        reviewedAt: new Date(),
      },
      include: { report: true },
    });

    // If approved, update item report status to RESOLVED
    if (targetDecision === "APPROVED") {
      await prisma.itemReport.update({
        where: { id: claim.reportId },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      }).catch(() => {});
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        communityId: claim.report.communityId,
        action: `CLAIM_${targetDecision}`,
        targetType: "CLAIM",
        targetId: claim.id,
        metadata: { decisionReason: reason },
      },
    }).catch(() => {});

    // Notify claimant
    await prisma.notification.create({
      data: {
        userId: claim.claimantId,
        communityId: claim.report.communityId,
        kind: `CLAIM_${targetDecision}`,
        payload: {
          claimId: claim.id,
          reportId: claim.reportId,
          reportTitle: claim.report.title,
          decision: targetDecision,
          reason,
        },
        dedupeKey: `claim-dec-${claim.id}-${targetDecision}`,
      },
    }).catch(() => {});

    res.json({
      data: {
        id: claim.id,
        claimId: claim.id,
        status: targetDecision,
        reason: reason || "Reviewer decision recorded.",
        auditTrail: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

claimsRouter.post("/:claimId/decision", handleDecision);
claimsRouter.post("/claims/:claimId/decision", handleDecision);

// GET /api/v1/claims/:claimId — claim details (restricted to claimant / moderator)
const handleGetClaim = async (req: any, res: any, next: any) => {
  try {
    const claimId = req.params.claimId;
    const currentUserId = req.session?.userId;
    const currentRole = req.session?.role;

    if (!currentUserId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required to access claim." } });
    }

    const claim = await prisma.ownershipClaim.findUnique({
      where: { id: claimId },
      include: {
        report: {
          select: {
            id: true,
            title: true,
            publicDescription: true,
            category: true,
            reportType: true,
            status: true,
            createdAt: true,
          },
        },
        claimant: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        claimEvidence: true,
      },
    });

    if (!claim) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Claim not found" } });
    }

    const isModerator = isModOrAdmin(currentRole);
    const isClaimant = currentUserId === claim.claimantId;

    if (!isModerator && !isClaimant) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied: Private claim evidence is only accessible to the claimant and authorized moderators.",
        },
      });
    }

    let decryptedClue: string | null = null;
    if (isModerator && claim.reportId) {
      const clueRecord = await prisma.privateReportDetails.findUnique({
        where: { reportId: claim.reportId },
      });
      if (clueRecord?.detailsCiphertext) {
        try {
          decryptedClue = decryptClue(clueRecord.detailsCiphertext, clueRecord.encryptionKeyVersion);
        } catch {
          decryptedClue = null;
        }
      }
    }

    res.json({
      data: {
        ...claim,
        report: {
          ...claim.report,
          privateClues: isModerator ? decryptedClue : undefined,
        },
        evidencePrivate: true,
        reviewerAccessOnly: !isClaimant,
        authorized: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

claimsRouter.get("/:claimId", handleGetClaim);
claimsRouter.get("/claims/:claimId", handleGetClaim);
