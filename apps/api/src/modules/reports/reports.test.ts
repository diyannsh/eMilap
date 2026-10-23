import { describe, it, expect } from "vitest";
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
