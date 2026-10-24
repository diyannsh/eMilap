import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEnvironment } from "./env";

describe("Production Environment Validation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("fails fast if DATABASE_URL is missing in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.DATABASE_URL;
    process.env.SESSION_SECRET = "production-secret-must-be-very-long-32-chars";
    process.env.CLUE_ENCRYPTION_KEY = "1111222233334444555566667777888811112222333344445555666677778888";

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("DATABASE_URL is required"))).toBe(true);
  });

  it("fails fast if SESSION_SECRET is too short (<32 chars) in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.SESSION_SECRET = "short-secret";
    process.env.CLUE_ENCRYPTION_KEY = "1111222233334444555566667777888811112222333344445555666677778888";

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("SESSION_SECRET must be at least 32 characters"))).toBe(true);
  });

  it("fails fast if SESSION_SECRET uses development default in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.SESSION_SECRET = "dev-secret-change-me-min-32";
    process.env.CLUE_ENCRYPTION_KEY = "1111222233334444555566667777888811112222333344445555666677778888";

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("SESSION_SECRET must not use the default development secret"))).toBe(true);
  });

  it("fails fast if CLUE_ENCRYPTION_KEY uses known dev key in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.SESSION_SECRET = "production-secret-must-be-very-long-32-chars";
    process.env.CLUE_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("CLUE_ENCRYPTION_KEY must not use the known development hex key"))).toBe(true);
  });

  it("fails fast if CLUE_ENCRYPTION_KEY is not valid 64-hex chars", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.SESSION_SECRET = "production-secret-must-be-very-long-32-chars";
    process.env.CLUE_ENCRYPTION_KEY = "not-a-valid-hex-key";

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("must be a valid 64-character hex string"))).toBe(true);
  });

  it("passes validation with valid production configuration", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.SESSION_SECRET = "production-secret-must-be-very-long-32-chars";
    process.env.CLUE_ENCRYPTION_KEY = "aaaaaaaabbbbbbbbccccccccddddddddeeeeeeeeffffffff0000000011111111";

    const result = validateEnvironment();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
