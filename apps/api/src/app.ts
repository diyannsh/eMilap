import express, { type Express, type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import fs from "node:fs";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createSession } from "./config/session";
import { errorHandler } from "./middleware/error-handler";
import { createRateLimiter } from "./middleware/rate-limiter";
import { csrfProtection } from "./middleware/csrf-protection";
import { authRouter } from "./modules/auth/auth.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { claimsRouter } from "./modules/claims/claims.routes";
import { uploadsRouter } from "./modules/uploads/uploads.routes";
import { matchesRouter } from "./modules/matches/matches.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { membershipRouter } from "./modules/auth/membership.routes";
import { chatRouter } from "./modules/chat/chat.routes";

export const API_VERSION = "v1";
export const API_BASE_PATH = `/api/${API_VERSION}`;

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  if (process.env.NODE_ENV === "production" || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: process.env.WEB_ORIGIN || true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(createSession());
  app.use(csrfProtection);

  // Health checks
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

  // Auth rate limiter (30 requests per 15 minutes)
  const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  });

  // Route modules
  app.use(`${API_BASE_PATH}/auth`, authLimiter, authRouter);
  app.use(`${API_BASE_PATH}/reports`, reportsRouter);
  app.use(`${API_BASE_PATH}/claims`, claimsRouter);
  app.use(`${API_BASE_PATH}/uploads`, uploadsRouter);
  app.use(`${API_BASE_PATH}/matches`, matchesRouter);
  app.use(`${API_BASE_PATH}/notifications`, notificationsRouter);
  app.use(`${API_BASE_PATH}/admin`, adminRouter);
  app.use(`${API_BASE_PATH}/communities`, membershipRouter);
  app.use(`${API_BASE_PATH}/chat`, chatRouter);

  // Single-Origin SPA Serving (Render Free deployment / Production)
  const webDistPath = process.env.WEB_DIST_PATH || path.resolve(process.cwd(), "dist");
  if (fs.existsSync(webDistPath) && fs.existsSync(path.join(webDistPath, "index.html"))) {
    app.use(
      express.static(webDistPath, {
        index: false,
        maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
      }),
    );

    app.get("*", (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
        return next();
      }
      res.sendFile(path.join(webDistPath, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}

async function checkDatabase(): Promise<{ ok: boolean }> {
  const { pingDatabase } = await import("./db/client");
  const ok = await pingDatabase();
  return { ok };
}
