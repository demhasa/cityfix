import { describe, expect, it } from "vitest";
import { aiResultSchema, calculatePriority, isDuplicateReport } from "@/lib/domain";

describe("CityFix domain rules", () => {
  it("matches nearby reports with the same category", () => {
    const now = new Date("2026-11-09T12:00:00Z");
    expect(isDuplicateReport({ lat: 42.66, lng: 21.16, category: "pothole", createdAt: now }, { lat: 42.6601, lng: 21.1601, category: "pothole", createdAt: now })).toBe(true);
    expect(isDuplicateReport({ lat: 42.66, lng: 21.16, category: "garbage", createdAt: now }, { lat: 42.6601, lng: 21.1601, category: "pothole", createdAt: now })).toBe(false);
  });
  it("calculates a transparent bounded priority score", () => {
    const result = calculatePriority({ dangerLevel: 5, reportCount: 20, daysUnresolved: 20, nearSensitivePlace: true, manualBoost: 5 });
    expect(result.score).toBe(100);
    expect(result.breakdown.sensitive).toBe(15);
  });
  it("rejects malformed AI output", () => {
    expect(aiResultSchema.safeParse({ category: "unknown" }).success).toBe(false);
  });
});
