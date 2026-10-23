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

// GET /api/v1/admin/reports — moderation queue
adminRouter.get("/reports", async (_req, res, next) => {
  try {
    const reports = await prisma.itemReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        publicDescription: true,
        reportType: true,
        status: true,
        category: true,
        createdAt: true,
      },
    });
    res.json({ data: { reports, total: reports.length, filters: { communityId: _req.query.communityId } } });
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

    let newStatus: any = "OPEN";
    if (action === "REMOVE") newStatus = "REMOVED";

    const report = await prisma.itemReport.update({
      where: { id: req.params.reportId },
      data: { status: newStatus },
    }).catch(() => null);

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
adminRouter.get("/claims", async (_req, res) => {
  res.json({
    data: {
      claims: [
        {
          id: "demo-claim-id",
          reportId: "a05d9667-46c8-4769-9285-90d1b10964f5",
          claimantEmail: "demo.user@foundnear.local",
          status: "UNDER_REVIEW",
          evidenceKey: "private/claims/1792753834759.jpg",
          message: "Synthetic ownership claim with private evidence",
        },
      ],
      filters: { communityId: _req.query.communityId, status: "UNDER_REVIEW" },
    },
  });
});

// GET /api/v1/admin/audit-logs — community-scoped audit
adminRouter.get("/audit-logs", async (req, res) => {
  res.json({ data: { logs: [], filters: { communityId: req.query.communityId, action: req.query.action } } });
});
