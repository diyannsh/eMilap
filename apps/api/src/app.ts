import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createSession } from "./config/session";
import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { claimsRouter } from "./modules/claims/claims.routes";
import { uploadsRouter } from "./modules/uploads/uploads.routes";
import { matchesRouter } from "./modules/matches/matches.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { membershipRouter } from "./modules/auth/membership.routes";

export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  if (process.env.NODE_ENV === "production" || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.WEB_ORIGIN || true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(createSession());

  app.get("/health/live", (_req: Request, res: Response) => {
    res.json({ data: { status: "ok", service: "api" } });
  });

  app.get("/health/ready", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const dbCheck = await checkDatabase();
      res.json({
        data: {
          status: dbCheck.ok ? "ok" : "degraded",
          service: "api",
          dependencies: { database: dbCheck.ok ? "up" : "down" },
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.use(`${API_BASE_PATH}/auth`, authRouter);
  // Mount implemented module routers (all exist and export Router)
  // Reports, claims, uploads, matches, notifications, admin, membership
  // Note: some routes are skeletons/placeholders; full DB integration pending
  app.use(`${API_BASE_PATH}/reports`, reportsRouter);
  app.use(`${API_BASE_PATH}/claims`, claimsRouter);
  app.use(`${API_BASE_PATH}/uploads`, uploadsRouter);
  app.use(`${API_BASE_PATH}/matches`, matchesRouter);
  app.use(`${API_BASE_PATH}/notifications`, notificationsRouter);
  app.use(`${API_BASE_PATH}/admin`, adminRouter);
  app.use(`${API_BASE_PATH}/communities`, membershipRouter);

  app.use(errorHandler);

  return app;
}

async function checkDatabase(): Promise<{ ok: boolean }> {
  const { pingDatabase } = await import("./db/client");
  const ok = await pingDatabase();
  return { ok };
}
