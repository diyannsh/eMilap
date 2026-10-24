import { describe, it, expect } from "vitest";
import { computeDeterministicScore, ALGORITHM_VERSION } from "./worker.js";

describe("Deterministic Candidate Matching Engine", () => {
  it("matches category, color, location, and time window with expected score breakdown", () => {
    const reportA = {
      category: "BAG",
      color: "Navy Blue",
      approximateLocation: "Library 2nd Floor",
      occurredAt: new Date("2026-10-23T10:00:00Z"),
    };
    const reportB = {
      category: "bag",
      color: "blue",
      approximateLocation: "library",
      occurredAt: new Date("2026-10-23T14:00:00Z"),
    };

    const { score, breakdown } = computeDeterministicScore(reportA, reportB);

    expect(score).toBe(90); // 30 (category) + 25 (color) + 20 (location) + 15 (time)
    expect(breakdown.category).toBe(30);
    expect(breakdown.color).toBe(25);
    expect(breakdown.location).toBe(20);
    expect(breakdown.time).toBe(15);
  });

  it("yields zero score for items in completely different categories", () => {
    const reportA = {
      category: "ELECTRONICS",
      color: "Black",
      approximateLocation: "Cafeteria",
      occurredAt: new Date("2026-10-20T10:00:00Z"),
    };
    const reportB = {
      category: "WALLET",
      color: "Brown",
      approximateLocation: "Gymnasium",
      occurredAt: new Date("2026-10-23T10:00:00Z"),
    };

    const { score, breakdown } = computeDeterministicScore(reportA, reportB);

    expect(score).toBe(0);
    expect(breakdown.category).toBe(0);
    expect(breakdown.color).toBe(0);
    expect(breakdown.location).toBe(0);
  });

  it("identifies algorithm version correctly", () => {
    expect(ALGORITHM_VERSION).toBe("deterministic-v1.0");
  });
});
