import { describe, it, expect, vi } from "vitest";
import { createRateLimiter } from "./rate-limiter";
import { csrfProtection } from "./csrf-protection";

describe("Rate Limiter Middleware", () => {
  it("allows requests under the maximum limit and sets headers", () => {
    const limiter = createRateLimiter({ windowMs: 10000, max: 2 });

    const req: any = { ip: "192.168.1.1", socket: {} };
    const headers: Record<string, any> = {};
    const res: any = {
      setHeader: (name: string, value: any) => {
        headers[name] = value;
      },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    // 1st request
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(headers["X-RateLimit-Limit"]).toBe(2);
    expect(headers["X-RateLimit-Remaining"]).toBe(1);

    // 2nd request
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(headers["X-RateLimit-Remaining"]).toBe(0);

    // 3rd request should be blocked with 429
    limiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(2); // not called again
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "TOO_MANY_REQUESTS" }),
      })
    );
  });
});

describe("CSRF Protection Middleware", () => {
  it("allows safe GET requests without checking origin", () => {
    const req: any = { method: "GET" };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allows unauthenticated POST requests (e.g. login/register)", () => {
    const req: any = { method: "POST", session: {}, headers: {} };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("blocks authenticated state-changing requests with mismatched cross-origin", () => {
    const oldNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.WEB_ORIGIN = "https://emilap.campus.edu";

    const req: any = {
      method: "POST",
      session: { userId: "user-123" },
      headers: {
        host: "api.campus.edu",
        origin: "https://evil-attacker.com",
      },
    };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    csrfProtection(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "CSRF_BLOCKED" }),
      })
    );

    process.env.NODE_ENV = oldNodeEnv;
  });

  it("allows authenticated state-changing requests matching WEB_ORIGIN or host", () => {
    const oldNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.WEB_ORIGIN = "https://emilap.campus.edu";

    const req: any = {
      method: "POST",
      session: { userId: "user-123" },
      headers: {
        host: "emilap.campus.edu",
        origin: "https://emilap.campus.edu",
      },
    };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    process.env.NODE_ENV = oldNodeEnv;
  });
});
