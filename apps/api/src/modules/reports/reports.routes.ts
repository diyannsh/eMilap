import { Router } from "express";
import { createReportSchema, updateReportSchema } from "./reports.schemas";
import { prisma } from "../../db/client";
import { encryptClue, decryptClue } from "../../lib/encryption";

export const reportsRouter = Router();

// POST /api/v1/reports
reportsRouter.post("/", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required to create a report" } });
    }

    const data = createReportSchema.parse(req.body);

    let communityId = data.communityId || req.session?.communityId;
    if (!communityId) {
      const activeCommunity = await prisma.community.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
      if (!activeCommunity) {
        return res.status(400).json({ error: { code: "NO_COMMUNITY", message: "A campus community must be selected or created first" } });
      }
      communityId = activeCommunity.id;
    }

    // Verify community exists
    const community = await prisma.community.findUnique({ where: { id: communityId } });
    if (!community) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Selected community does not exist" } });
    }

    const occurredAt = data.occurredAt ? new Date(data.occurredAt) : undefined;

    const report = await prisma.itemReport.create({
      data: {
        communityId,
        reporterId: userId,
        reportType: data.reportType,
        title: data.title.trim(),
        publicDescription: data.publicDescription.trim(),
        category: data.category.trim(),
        color: data.color?.trim() || null,
        brand: data.brand?.trim() || null,
        approximateLocation: data.approximateLocation?.trim() || null,
        occurredAt,
        occurredAtIsApprox: data.occurredAtIsApproximate || false,
        status: "OPEN",
      },
    });

    // Store private ownership clues if provided (strictly separate and encrypted with AES-256-GCM)
    if (data.privateDetails && data.privateDetails.trim()) {
      const { ciphertext, version } = encryptClue(data.privateDetails.trim());
      await prisma.privateReportDetails.create({
        data: {
          reportId: report.id,
          detailsCiphertext: ciphertext,
          encryptionKeyVersion: version,
        },
      });
    }

    // Associate image keys if provided
    if (data.imageObjectKeys && data.imageObjectKeys.length > 0) {
      for (let i = 0; i < data.imageObjectKeys.length; i++) {
        const key = data.imageObjectKeys[i];
        if (key && typeof key === "string") {
          await prisma.itemImage.create({
            data: {
              reportId: report.id,
              objectKey: key,
              mimeType: key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg",
              byteSize: BigInt(1024),
              sortOrder: i,
            },
          }).catch(() => {});
        }
      }
    }

    // Store attributes for search/filtering
    if (data.color) {
      await prisma.itemAttribute.create({
        data: {
          reportId: report.id,
          name: "color",
          normalizedValue: data.color.trim().toLowerCase(),
          visibility: "PUBLIC",
          source: "USER",
        },
      }).catch(() => {});
    }
    if (data.brand) {
      await prisma.itemAttribute.create({
        data: {
          reportId: report.id,
          name: "brand",
          normalizedValue: data.brand.trim().toLowerCase(),
          visibility: "PUBLIC",
          source: "USER",
        },
      }).catch(() => {});
    }

    // Queue background matching job
    await prisma.matchingJob.create({
      data: {
        communityId,
        reportId: report.id,
        reportVersion: report.version,
        status: "PENDING",
      },
    }).catch(() => {});

    res.status(201).json({
      data: {
        ...report,
        matchingStatus: "QUEUED",
        privateDetails: undefined, // Never leak in public API response
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports
reportsRouter.get("/", async (req, res, next) => {
  try {
    const { communityId, type, status, search, category } = req.query as any;
    const where: any = {};

    const targetCommunityId = (communityId as string) || req.session?.communityId;
    if (targetCommunityId) where.communityId = targetCommunityId;
    if (type) where.reportType = type.toUpperCase();
    if (status) {
      where.status = status.toUpperCase();
    } else {
      where.status = { not: "REMOVED" };
    }
    if (category) where.category = category;

    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { publicDescription: { contains: q, mode: "insensitive" } },
        { approximateLocation: { contains: q, mode: "insensitive" } },
        { color: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ];
    }

    const reports = await prisma.itemReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        communityId: true,
        reporterId: true,
        reportType: true,
        status: true,
        title: true,
        publicDescription: true,
        category: true,
        color: true,
        brand: true,
        approximateLocation: true,
        occurredAt: true,
        createdAt: true,
        reporter: {
          select: {
            id: true,
            displayName: true,
          },
        },
        images: {
          select: {
            id: true,
            objectKey: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    res.json({ data: reports, pagination: { total: reports.length, limit: 50 } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/:id
reportsRouter.get("/:id", async (req, res, next) => {
  try {
    const report = await prisma.itemReport.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        communityId: true,
        reporterId: true,
        reportType: true,
        status: true,
        title: true,
        publicDescription: true,
        category: true,
        color: true,
        brand: true,
        approximateLocation: true,
        occurredAt: true,
        createdAt: true,
        reporter: {
          select: {
            id: true,
            displayName: true,
          },
        },
        images: {
          select: {
            id: true,
            objectKey: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        attributes: {
          where: { visibility: "PUBLIC" },
          select: {
            name: true,
            normalizedValue: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not found" } });
    }

    // Check if requester is author or authorized moderator to return decrypted private clues
    const isAuthor = req.session?.userId && req.session.userId === report.reporterId;
    const isModerator = req.session?.role === "MODERATOR" || req.session?.role === "ADMIN";
    const canAccessClues = isAuthor || isModerator;

    let privateClues: string | null = null;
    if (canAccessClues) {
      const detail = await prisma.privateReportDetails.findUnique({ where: { reportId: report.id } });
      if (detail?.detailsCiphertext) {
        try {
          privateClues = decryptClue(detail.detailsCiphertext, detail.encryptionKeyVersion);
        } catch {
          privateClues = null;
        }
      }
    }

    res.json({
      data: {
        ...report,
        privateClues: canAccessClues ? privateClues : undefined,
        publicFieldsOnly: !canAccessClues,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/reports/:id
reportsRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    const role = req.session?.role;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }

    const existing = await prisma.itemReport.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not found" } });
    }

    const isAuthor = existing.reporterId === userId;
    const isMod = role === "MODERATOR" || role === "ADMIN";
    if (!isAuthor && !isMod) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only the author or a moderator may edit this report" } });
    }

    const data = updateReportSchema.parse(req.body);

    const updated = await prisma.itemReport.update({
      where: { id: req.params.id },
      data: {
        title: data.title?.trim(),
        publicDescription: data.publicDescription?.trim(),
        category: data.category?.trim(),
        color: data.color?.trim(),
        brand: data.brand?.trim(),
        approximateLocation: data.approximateLocation?.trim(),
        status: data.status,
        version: { increment: 1 },
      },
    });

    res.json({ data: { ...updated, updated: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/reports/:id/close
reportsRouter.post("/:id/close", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    const role = req.session?.role;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }

    const existing = await prisma.itemReport.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not found" } });
    }

    const isAuthor = existing.reporterId === userId;
    const isMod = role === "MODERATOR" || role === "ADMIN";
    if (!isAuthor && !isMod) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Only the author or a moderator may close this report" } });
    }

    const report = await prisma.itemReport.update({
      where: { id: req.params.id },
      data: { status: "CLOSED" },
    });

    await prisma.reportStatusHistory.create({
      data: {
        reportId: report.id,
        actorId: userId,
        fromStatus: existing.status,
        toStatus: "CLOSED",
        reasonCode: "USER_CLOSED",
      },
    }).catch(() => {});

    res.json({ data: { id: report.id, status: "CLOSED" } });
  } catch (err) {
    next(err);
  }
});
