import { Router } from "express";

export const notificationsRouter = Router();

notificationsRouter.get("/", async (req, res, next) => {
  try {
    res.json({ data: [], pagination: { total: 0, unread: 0 } });
  } catch (err) { next(err); }
});

notificationsRouter.get("/unread-count", async (req, res, next) => {
  try { res.json({ data: { count: 0 } }); } catch (err) { next(err); }
});

notificationsRouter.post("/:id/read", async (req, res, next) => {
  try { res.json({ data: { id: req.params.id, readAt: new Date().toISOString() } }); } catch (err) { next(err); }
});

notificationsRouter.post("/read-all", async (req, res, next) => {
  try { res.json({ data: { updated: 0 } }); } catch (err) { next(err); }
});
