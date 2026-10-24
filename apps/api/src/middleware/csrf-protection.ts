import type { Request, Response, NextFunction } from "express";

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const stateChangingMethods = ["POST", "PATCH", "PUT", "DELETE"];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // State-changing requests with an active cookie session must have valid matching origin/referer
  if (!(req.session as any)?.userId) {
    return next();
  }

  const originHeader = req.headers.origin || req.headers.referer;
  if (originHeader) {
    try {
      const originUrl = new URL(originHeader);
      const host = req.headers.host;
      const webOrigin = process.env.WEB_ORIGIN;

      const isSameHost = Boolean(host && originUrl.host === host);
      const isAllowedOrigin = Boolean(webOrigin && (originHeader.startsWith(webOrigin) || originUrl.origin === webOrigin));
      const isDevLocal = process.env.NODE_ENV !== "production" && (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1");

      if (!isSameHost && !isAllowedOrigin && !isDevLocal) {
        return res.status(403).json({
          error: {
            code: "CSRF_BLOCKED",
            message: "State-changing cross-origin request rejected. Origin does not match trusted host.",
          },
        });
      }
    } catch {
      return res.status(403).json({
        error: {
          code: "CSRF_BLOCKED",
          message: "Invalid origin header on state-changing request.",
        },
      });
    }
  }

  next();
}
