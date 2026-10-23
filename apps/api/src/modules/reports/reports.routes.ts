import { Router } from "express";
import { createReportSchema, updateReportSchema } from "./reports.schemas";
import { prisma } from "../../db/client";

export const reportsRouter = Router();

// POST /api/v1/reports
reportsRouter.post("/", async (req, res, next) => {
  try {
    const data = createReportSchema.parse(req.body);
    const reporterId = req.session?.userId || "39bfd1f4-ac5d-4b50-9d6f-1e50c69b1c42";
    const communityId = data.communityId || req.session?.communityId || "85fa7a33-a3df-4295-9597-e1741dec3b63";

    const report = await prisma.itemReport.create({
      data: {
        communityId,
        reporterId,
        reportType: data.reportType,
        title: data.title,
        publicDescription: data.publicDescription,
        category: data.category,
        color: data.color,
        brand: data.brand,
        approximateLocation: data.approximateLocation,
        occurredAtIsApprox: data.occurredAtIsApproximate || false,
        status: "OPEN",
      },
    });

    res.status(201).json({
      data: {
        ...report,
        matchingStatus: "QUEUED",
        privateDetails: undefined, // Never expose in public response
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports
reportsRouter.get("/", async (req, res, next) => {
  try {
    const { communityId, type, status } = req.query as any;
    const where: any = {};
    if (communityId) where.communityId = communityId;
    if (type) where.reportType = type;
    if (status) where.status = status;

    const reports = await prisma.itemReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        communityId: true,
        reportType: true,
        status: true,
        title: true,
        publicDescription: true,
        category: true,
        color: true,
        brand: true,
        approximateLocation: true,
        createdAt: true,
      },
    });
    res.json({ data: reports, pagination: { total: reports.length, limit: 20 } });
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
        createdAt: true,
      },
    });
    if (!report) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not found" } });
    }
    res.json({ data: { ...report, publicFieldsOnly: true, privateDetails: undefined } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/reports/:id
reportsRouter.patch("/:id", async (req, res, next) => {
  try {
    const data = updateReportSchema.parse(req.body);
    const report = await prisma.itemReport.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        publicDescription: data.publicDescription,
        category: data.category,
        color: data.color,
        brand: data.brand,
        approximateLocation: data.approximateLocation,
        status: data.status,
      },
    });
    res.json({ data: { ...report, updated: true, publicFieldsOnly: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/reports/:id/close
reportsRouter.post("/:id/close", async (req, res, next) => {
  try {
    const report = await prisma.itemReport.update({
      where: { id: req.params.id },
      data: { status: "CLOSED" },
    });
    res.json({ data: { id: report.id, status: "CLOSED" } });
  } catch (err) {
    next(err);
  }
});
