export type GoalStatus = "on_track" | "behind" | "completed";

export type GoalCalcInput = {
  target: number;
  current: number;
  deadline: Date;
};

export type CategoryAvg = {
  category: string;
  monthlyAvg: number;
};

const ESSENTIAL_CATEGORIES = new Set([
  "moradia",
  "saude",
  "transporte",
  "educacao",
  "impostos",
  "dizimo",
  "alimentacao",
]);

/**
 * Number of calendar months between `from` and `to`, rounded up.
 * If `to` is in the same month as `from` (or later within month), returns at least 1.
 * Returns 0 if `to` is strictly before `from`.
 */
export function monthsBetween(from: Date, to: Date): number {
  if (to.getTime() < from.getTime()) return 0;
  // Use calendar year/month arithmetic to avoid floating-point day approximations
  const fromYear = from.getFullYear();
  const fromMonth = from.getMonth();
  const toYear = to.getFullYear();
  const toMonth = to.getMonth();
  const wholeMonths = (toYear - fromYear) * 12 + (toMonth - fromMonth);
  // If the day-of-month in `to` is strictly greater than in `from`, we've crossed into
  // a new partial month — round up by adding 1. Otherwise wholeMonths already includes
  // the partial month. We always want at least 1.
  const extra = to.getDate() > from.getDate() ? 1 : 0;
  return Math.max(1, wholeMonths + extra);
}

export function monthlyContributionRequired(goal: GoalCalcInput, now: Date = new Date()): number {
  const remaining = goal.target - goal.current;
  if (remaining <= 0) return 0;
  const months = monthsBetween(now, goal.deadline);
  if (months <= 0) return remaining;
  return Math.ceil((remaining / months) * 100) / 100;
}

export function computeGoalStatus(goal: GoalCalcInput, now: Date = new Date()): GoalStatus {
  if (goal.current >= goal.target) return "completed";

  // Heuristic: progress vs time-remaining ratio (no created_at available).
  const monthsRemaining = monthsBetween(now, goal.deadline);
  const required = monthlyContributionRequired(goal, now);
  const remaining = goal.target - goal.current;

  // If meeting required pace would take MORE than the remaining months at any reasonable
  // monthly contribution rate, behind.
  // Heuristic: if current < target * (1 - monthsRemaining * 0.0833 * 1.2), we're behind.
  // (0.0833 = 1/12; the 1.2 gives a 20% grace zone.)
  const expectedAtNow = goal.target * Math.max(0, 1 - monthsRemaining * 0.0833 * 1.2);
  if (goal.current >= expectedAtNow * 0.8) return "on_track";

  // Also classify as behind if required monthly contribution exceeds 50% of total target
  // (signaling impractical pace with deadline very close).
  if (required > goal.target * 0.5 && remaining > 0) return "behind";

  return "behind";
}

/**
 * Suggests cutting from the largest non-essential category to reach the
 * required monthly contribution. Returns null if no suggestion is possible.
 *
 * Cap: never suggest cutting more than 60% of a category's monthly spend
 * (avoid unrealistic recommendations).
 */
export function suggestSavingFromCategory(
  monthlyNeeded: number,
  categoryAvgs: CategoryAvg[],
): { category: string; cutAmount: number; impactDescription: string } | null {
  if (monthlyNeeded <= 0) return null;
  const candidates = categoryAvgs
    .filter((c) => !ESSENTIAL_CATEGORIES.has(c.category))
    .filter((c) => c.monthlyAvg > 0)
    .sort((a, b) => b.monthlyAvg - a.monthlyAvg);

  if (candidates.length === 0) return null;
  const top = candidates[0]!;
  const maxCut = Math.round(top.monthlyAvg * 0.6 * 100) / 100;
  const cutAmount = Math.min(monthlyNeeded, maxCut);
  if (cutAmount <= 0) return null;

  const pct = Math.round((cutAmount / top.monthlyAvg) * 100);
  return {
    category: top.category,
    cutAmount,
    impactDescription: `Reduzir ~${pct}% em ${top.category} cobre R$ ${cutAmount.toFixed(2)}/mês.`,
  };
}
