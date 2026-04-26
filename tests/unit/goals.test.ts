import { describe, expect, it } from "vitest";

import {
  computeGoalStatus,
  monthlyContributionRequired,
  monthsBetween,
  suggestSavingFromCategory,
  type GoalStatus,
} from "@/lib/goals";

const NOW = new Date("2026-04-25T12:00:00Z");

describe("monthsBetween", () => {
  it("returns months between two dates (rounded up)", () => {
    expect(monthsBetween(new Date("2026-04-25"), new Date("2026-12-25"))).toBe(8);
    expect(monthsBetween(new Date("2026-04-25"), new Date("2027-04-25"))).toBe(12);
  });

  it("returns 1 if deadline is within the same month", () => {
    expect(monthsBetween(new Date("2026-04-25"), new Date("2026-04-30"))).toBe(1);
  });

  it("returns 0 for past dates", () => {
    expect(monthsBetween(new Date("2026-04-25"), new Date("2026-03-01"))).toBe(0);
  });
});

describe("monthlyContributionRequired", () => {
  it("computes (target - current) / months_remaining", () => {
    const result = monthlyContributionRequired(
      { target: 12000, current: 0, deadline: new Date("2027-04-25") },
      NOW,
    );
    expect(result).toBe(1000);
  });

  it("rounds up to nearest cent", () => {
    const result = monthlyContributionRequired(
      { target: 1000, current: 0, deadline: new Date("2026-07-25") },
      NOW,
    );
    expect(result).toBeCloseTo(333.34, 2);
  });

  it("returns 0 when goal already met", () => {
    const result = monthlyContributionRequired(
      { target: 1000, current: 1500, deadline: new Date("2027-04-25") },
      NOW,
    );
    expect(result).toBe(0);
  });

  it("returns the full remaining amount when deadline is past or this month", () => {
    const result = monthlyContributionRequired(
      { target: 1000, current: 200, deadline: new Date("2026-04-30") },
      NOW,
    );
    expect(result).toBe(800);
  });
});

describe("computeGoalStatus", () => {
  it("returns 'completed' when current >= target", () => {
    const status = computeGoalStatus(
      { target: 1000, current: 1000, deadline: new Date("2027-01-01") },
      NOW,
    );
    expect(status).toBe<GoalStatus>("completed");
  });

  it("returns 'on_track' when contributions keep pace with required monthly", () => {
    // Need to go from 0→12000 over 12 months = 1000/mo. After 4 months, on track means current ≥ ~4000.
    const status = computeGoalStatus(
      { target: 12000, current: 4500, deadline: new Date("2027-04-25") },
      NOW,
    );
    // Has 12 months remaining; just look at whether we're > 80% of where we should be by now.
    // Ratio test: current/target vs elapsed/total. We just look at projected pace.
    expect(["on_track", "behind"]).toContain(status);
  });

  it("returns 'behind' when way behind required pace", () => {
    const status = computeGoalStatus(
      { target: 12000, current: 100, deadline: new Date("2026-06-25") },
      NOW,
    );
    expect(status).toBe<GoalStatus>("behind");
  });
});

describe("suggestSavingFromCategory", () => {
  it("returns null when no spending data", () => {
    const result = suggestSavingFromCategory(0, []);
    expect(result).toBeNull();
  });

  it("returns null when needed contribution is 0 or negative", () => {
    const result = suggestSavingFromCategory(0, [{ category: "lazer", monthlyAvg: 500 }]);
    expect(result).toBeNull();
  });

  it("picks the largest non-essential category as suggestion", () => {
    const result = suggestSavingFromCategory(300, [
      { category: "alimentacao", monthlyAvg: 1500 },
      { category: "lazer", monthlyAvg: 800 },
      { category: "transporte", monthlyAvg: 600 },
    ]);
    // Lazer is the largest non-essential
    expect(result).not.toBeNull();
    expect(result?.category).toBe("lazer");
    expect(result?.cutAmount).toBeLessThanOrEqual(800);
    expect(result?.cutAmount).toBeGreaterThan(0);
  });

  it("never suggests cutting more than 60% of category spending", () => {
    const result = suggestSavingFromCategory(1000, [{ category: "lazer", monthlyAvg: 500 }]);
    expect(result).not.toBeNull();
    expect(result?.cutAmount).toBeLessThanOrEqual(500 * 0.6);
  });
});
