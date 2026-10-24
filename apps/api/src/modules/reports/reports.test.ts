import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { createApp } from "../../app";
import { createReportSchema, updateReportSchema } from "./reports.schemas.js";

describe("Report Validation Schemas", () => {
  it("validates a compliant lost item report payload", () => {
    const validData = {
      reportType: "LOST",
      title: "Blue hydroflask bottle",
      category: "BOTTLE",
      color: "Blue",
      approximateLocation: "Science Block Lobby",
      publicDescription: "Stainless steel water bottle with national park stickers.",
    };

    const parsed = createReportSchema.parse(validData);
    expect(parsed.title).toBe("Blue hydroflask bottle");
    expect(parsed.reportType).toBe("LOST");
    expect(parsed.occurredAtIsApproximate).toBe(false);
  });

  it("rejects titles that are too short", () => {
    const invalidData = {
      reportType: "LOST",
      title: "A",
      category: "BAG",
      publicDescription: "A valid description of the item.",
    };

    expect(() => createReportSchema.parse(invalidData)).toThrow();
  });

  it("accepts valid status updates in updateReportSchema", () => {
    const update = updateReportSchema.parse({ status: "CLOSED" });
    expect(update.status).toBe("CLOSED");
  });
});

describe("Report Privacy & Upload Security API", () => {
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

  it("blocks unauthenticated report creation with 401 UNAUTHORIZED", async () => {
    const res = await fetch(`${baseUrl}/api/v1/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportType: "LOST",
        title: "Test item",
        publicDescription: "Test description",
        category: "Other",
      }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects report image upload when binary payload is missing", async () => {
    process.env.STORAGE_LOCAL = "true";
    const res = await fetch(`${baseUrl}/api/v1/uploads/report-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mimeType: "image/jpeg", byteSize: 1024 }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("Missing image binary payload");
  });

  it("rejects upload when mime type does not match binary content", async () => {
    process.env.STORAGE_LOCAL = "true";
    // Send random text bytes claiming to be image/jpeg
    const fakeBase64 = Buffer.from("NOT_A_REAL_JPEG_IMAGE_HEADER").toString("base64");
    const res = await fetch(`${baseUrl}/api/v1/uploads/report-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mimeType: "image/jpeg",
        base64: `data:image/jpeg;base64,${fakeBase64}`,
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("does not match declared mime type");
  });

  it("accepts valid image bytes matching declared mime type", async () => {
    process.env.STORAGE_LOCAL = "true";
    // Valid 1x1 PNG bytes
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const res = await fetch(`${baseUrl}/api/v1/uploads/report-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mimeType: "image/png",
        base64: `data:image/png;base64,${pngBase64}`,
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toBeDefined();
    expect(body.data.validated).toBe(true);
    expect(body.data.bytesWritten).toBeGreaterThan(0);
    expect(body.data.objectKey).toContain("reports/");
  });
});
