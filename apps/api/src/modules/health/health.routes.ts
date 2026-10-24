import { Router } from "express";

export const healthRouter: Router = Router();

healthRouter.get("/live", (_req, res) => {
  res.json({ data: { status: "ok", service: "api" } });
});

healthRouter.get("/ready", async (_req, res, next) => {
  try {
    const { pingDatabase } = await import("../../db/client");
    const ok = await pingDatabase();
    res.json({
      data: {
        status: ok ? "ok" : "degraded",
        service: "api",
        dependencies: { database: ok ? "up" : "down" },
      },
    });
  } catch (error) {
    next(error);
  }
});
