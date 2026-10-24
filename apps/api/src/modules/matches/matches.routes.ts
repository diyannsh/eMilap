import { Router } from "express";
import type { ItemReport } from "@prisma/client";
import { prisma } from "../../db/client";

export const matchesRouter = Router();

// GET /api/v1/matches — fetch real match candidates
matchesRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    const communityId = req.query?.communityId as string || req.session?.communityId;

    const where: any = { status: "ACTIVE" };
    if (communityId) {
      where.communityId = communityId;
    }

    // If user is logged in, find matches where reportA or reportB belongs to user
    if (userId) {
      const userReports = await prisma.itemReport.findMany({
        where: { reporterId: userId },
        select: { id: true },
      });
      const reportIds = userReports.map((r: Pick<ItemReport, "id">) => r.id);
      if (reportIds.length > 0) {
        where.OR = [
          { reportAId: { in: reportIds } },
          { reportBId: { in: reportIds } },
        ];
      }
    }

    const matches = await prisma.matchCandidate.findMany({
      where,
      orderBy: { score: "desc" },
      include: {
        reportA: {
          select: {
            id: true,
            title: true,
            publicDescription: true,
            category: true,
            color: true,
            brand: true,
            approximateLocation: true,
            reportType: true,
            status: true,
            createdAt: true,
            images: { select: { objectKey: true }, take: 1 },
          },
        },
        reportB: {
          select: {
            id: true,
            title: true,
            publicDescription: true,
            category: true,
            color: true,
            brand: true,
            approximateLocation: true,
            reportType: true,
            status: true,
            createdAt: true,
            images: { select: { objectKey: true }, take: 1 },
          },
        },
      },
    });

    res.json({
      data: matches,
      total: matches.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/matches/:matchId — get single match candidate
matchesRouter.get("/:matchId", async (req, res, next) => {
  try {
    const match = await prisma.matchCandidate.findUnique({
      where: { id: req.params.matchId },
      include: {
        reportA: true,
        reportB: true,
      },
    });
    if (!match) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Match candidate not found" } });
    }
    res.json({ data: match });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/matches/:matchId/dismiss — dismiss or reject a match
matchesRouter.post("/:matchId/dismiss", async (req, res, next) => {
  try {
    const matchId = req.params.matchId;
    const status = req.body?.status === "REJECTED" ? "REJECTED" : "DISMISSED";

    const match = await prisma.matchCandidate.update({
      where: { id: matchId },
      data: { status },
    }).catch(() => null);

    res.json({
      data: {
        id: matchId,
        status,
        updated: true,
        match,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/matches/:matchId
matchesRouter.patch("/:matchId", async (req, res, next) => {
  try {
    const matchId = req.params.matchId;
    const { status } = req.body || {};
    const validStatuses = ["ACTIVE", "DISMISSED", "REJECTED", "RESOLVED"];
    const targetStatus = validStatuses.includes(status) ? status : "DISMISSED";

    const match = await prisma.matchCandidate.update({
      where: { id: matchId },
      data: { status: targetStatus },
    }).catch(() => null);

    res.json({
      data: {
        id: matchId,
        status: targetStatus,
        updated: true,
        match,
      },
    });
  } catch (err) {
    next(err);
  }
});
