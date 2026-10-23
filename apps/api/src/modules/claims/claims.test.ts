import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { createApp } from "../../app";

describe("Claims Evidence Access & Upload API", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("returns local development upload endpoint when STORAGE_LOCAL=true", async () => {
    process.env.STORAGE_LOCAL = "true";
    const res = await fetch(`${baseUrl}/api/v1/claims/test-claim-1/evidence-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mimeType: "image/jpeg", byteSize: 2048 }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toBeDefined();
    expect(body.data.storage).toBe("local-development-only");
    expect(body.data.uploadEndpoint).toBe("/api/v1/uploads/claim-evidence");
    expect(body.data.objectKey).toContain("private/claims/");
  });

  it("blocks unauthorized anonymous access to private claim evidence URL with 401", async () => {
    const res = await fetch(`${baseUrl}/api/v1/claims/demo-claim-id/evidence-url`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("generates an S3 presigned PUT URL when STORAGE_LOCAL=false", async () => {
    process.env.STORAGE_LOCAL = "false";
    process.env.S3_BUCKET_EVIDENCE = "prod-evidence-bucket";
    process.env.S3_ACCESS_KEY_ID = "mock-access-key";
    process.env.S3_SECRET_ACCESS_KEY = "mock-secret-key-1234567890";
    process.env.S3_REGION = "us-east-1";

    const res = await fetch(`${baseUrl}/api/v1/claims/test-claim-2/evidence-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mimeType: "image/png" }),
    });

    // Reset STORAGE_LOCAL
    process.env.STORAGE_LOCAL = "true";

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.storage).toBe("provider-neutral-s3");
    expect(body.data.uploadUrl).toBeDefined();
    expect(body.data.uploadUrl).toContain("X-Amz-Signature=");
    expect(body.data.uploadUrl).toContain("X-Amz-Expires=900");
    expect(body.data.objectKey).toContain("private/claims/test-claim-2");
  });
});
