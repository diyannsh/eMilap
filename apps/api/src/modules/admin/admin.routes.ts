import { Router } from "express";
import { prisma } from "../../db/client";

export const adminRouter = Router();

function requireModerator(req: any, res: any, next: any) {
  if (req.session?.role !== "MODERATOR" && req.session?.role !== "ADMIN") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Moderator or admin required" } });
  }
  next();
}

adminRouter.use(requireModerator);

// GET /api/v1/admin/stats — dashboard statistics
adminRouter.get("/stats", async (req, res, next) => {
  try {
    const communityId = req.query?.communityId as string || req.session?.communityId;
    const reportWhere: any = communityId ? { communityId } : {};

    const [activeUsers, openReports, pendingClaims] = await Promise.all([
      prisma.user.count(),
      prisma.itemReport.count({ where: { ...reportWhere, status: "OPEN" } }),
      prisma.ownershipClaim.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    ]);

    res.json({
      data: {
        activeAccounts: activeUsers,
        reportsToReview: openReports,
        claimsToReview: pendingClaims,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/reports — moderation queue
adminRouter.get("/reports", async (req, res, next) => {
  try {
    const communityId = req.query?.communityId as string || req.session?.communityId;
    const where: any = communityId ? { communityId } : {};

    const reports = await prisma.itemReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        publicDescription: true,
        reportType: true,
        status: true,
        category: true,
        approximateLocation: true,
        createdAt: true,
        reporter: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    res.json({ data: { reports, total: reports.length, filters: { communityId } } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/reports/:reportId/action — flag/remove/restore
adminRouter.post("/reports/:reportId/action", async (req, res, next) => {
  try {
    const action = req.body?.action;
    const validActions = ["FLAG", "REMOVE", "RESTORE", "HOLD"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Invalid action" } });
    }

    const existing = await prisma.itemReport.findUnique({ where: { id: req.params.reportId } });
    if (!existing) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Report not found" } });
    }

    let newStatus: any = existing.status;
    if (action === "REMOVE") newStatus = "REMOVED";
    if (action === "RESTORE") newStatus = "OPEN";

    const report = await prisma.itemReport.update({
      where: { id: req.params.reportId },
      data: {
        status: newStatus,
        removedAt: action === "REMOVE" ? new Date() : null,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: req.session?.userId,
        communityId: existing.communityId,
        action: `REPORT_${action}`,
        targetType: "REPORT",
        targetId: existing.id,
        metadata: { reason: req.body?.reason || "Moderator review action", previousStatus: existing.status },
      },
    }).catch(() => {});

    res.json({
      data: {
        reportId: req.params.reportId,
        action,
        newStatus,
        stateChanged: true,
        audited: true,
        report,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/claims — pending claims
adminRouter.get("/claims", async (req, res, next) => {
  try {
    const claims = await prisma.ownershipClaim.findMany({
      orderBy: { submittedAt: "desc" },
      take: 50,
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

    res.json({
      data: {
        claims,
        total: claims.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/audit-logs — community-scoped audit
adminRouter.get("/audit-logs", async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    res.json({ data: { logs, total: logs.length } });
  } catch (err) {
    next(err);
  }
});
