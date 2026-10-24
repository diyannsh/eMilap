import { Router } from "express";
import { prisma } from "../../db/client";

export const notificationsRouter = Router();

// GET /api/v1/notifications — list user notifications
notificationsRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unread = notifications.filter((n) => !n.readAt).length;

    res.json({
      data: notifications,
      pagination: { total: notifications.length, unread },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/notifications/unread-count
notificationsRouter.get("/unread-count", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.json({ data: { count: 0 } });
    }

    const count = await prisma.notification.count({
      where: { userId, readAt: null },
    });

    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/notifications/:id/read — mark single notification as read
notificationsRouter.post("/:id/read", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }

    const now = new Date();
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId },
      data: { readAt: now },
    });

    res.json({ data: { id: req.params.id, readAt: now.toISOString() } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/notifications/read-all — mark all unread notifications as read
notificationsRouter.post("/read-all", async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Login required" } });
    }

    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ data: { updated: result.count } });
  } catch (err) {
    next(err);
  }
});
