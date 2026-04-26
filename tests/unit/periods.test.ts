import { describe, expect, it } from "vitest";

import { parsePeriod, periodToDateRange } from "@/lib/mock/periods";

describe("parsePeriod", () => {
  it("returns '1m' as default when no value provided", () => {
    expect(parsePeriod(undefined)).toBe("1m");
    expect(parsePeriod(null)).toBe("1m");
    expect(parsePeriod("")).toBe("1m");
  });

  it("returns the value when valid", () => {
    expect(parsePeriod("3m")).toBe("3m");
    expect(parsePeriod("6m")).toBe("6m");
    expect(parsePeriod("12m")).toBe("12m");
    expect(parsePeriod("ytd")).toBe("ytd");
  });

  it("falls back to '1m' for invalid input", () => {
    expect(parsePeriod("invalid")).toBe("1m");
    expect(parsePeriod("99m")).toBe("1m");
  });
});

describe("periodToDateRange", () => {
  const NOW = new Date("2026-04-25T12:00:00Z");

  it("'1m' returns the last 30 days", () => {
    const r = periodToDateRange("1m", NOW);
    expect(r.end.toISOString().slice(0, 10)).toBe("2026-04-25");
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-03-26");
  });

  it("'3m' returns last 3 months", () => {
    const r = periodToDateRange("3m", NOW);
    expect(r.end.toISOString().slice(0, 10)).toBe("2026-04-25");
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-01-25");
  });

  it("'6m' returns last 6 months", () => {
    const r = periodToDateRange("6m", NOW);
    expect(r.start.toISOString().slice(0, 10)).toBe("2025-10-25");
  });

  it("'12m' returns last 12 months", () => {
    const r = periodToDateRange("12m", NOW);
    expect(r.start.toISOString().slice(0, 10)).toBe("2025-04-25");
  });

  it("'ytd' returns from Jan 1 of current year", () => {
    const r = periodToDateRange("ytd", NOW);
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-01-01");
  });
});
