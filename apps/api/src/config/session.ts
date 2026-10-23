import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db/client";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    communityId?: string;
    role?: string;
  }
}

export function createSession() {
  const isProduction = process.env.NODE_ENV === "production";
  const usePostgres = isProduction || process.env.SESSION_STORAGE === "postgres";

  let store: session.Store | undefined;

  if (usePostgres && process.env.DATABASE_URL) {
    const PgSession = connectPgSimple(session);
    store = new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: false, // Handled deterministically by database migration 10_session_table.sql
      pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    });
  }

  const sessionTtlHours = Number(process.env.SESSION_TTL_HOURS || 168); // 7 days default
  const sameSite = (process.env.SESSION_SAME_SITE as "lax" | "strict" | "none") || "lax";

  return session({
    store,
    name: process.env.SESSION_COOKIE_NAME || "foundnear.sid",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me-min-32",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: sessionTtlHours * 60 * 60 * 1000,
    },
  });
}
