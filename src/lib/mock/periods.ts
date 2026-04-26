export type Period = "1m" | "3m" | "6m" | "12m" | "ytd";

const VALID_PERIODS: readonly Period[] = ["1m", "3m", "6m", "12m", "ytd"] as const;

export function parsePeriod(value: string | null | undefined): Period {
  if (!value) return "1m";
  return (VALID_PERIODS as readonly string[]).includes(value) ? (value as Period) : "1m";
}

export function periodToDateRange(
  period: Period,
  now: Date = new Date(),
): { start: Date; end: Date } {
  const end = new Date(now);

  if (period === "ytd") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    return { start, end };
  }

  const start = new Date(now);
  switch (period) {
    case "1m":
      start.setUTCDate(start.getUTCDate() - 30);
      break;
    case "3m":
      start.setUTCMonth(start.getUTCMonth() - 3);
      break;
    case "6m":
      start.setUTCMonth(start.getUTCMonth() - 6);
      break;
    case "12m":
      start.setUTCMonth(start.getUTCMonth() - 12);
      break;
  }

  return { start, end };
}

export const PERIOD_LABELS: Record<Period, string> = {
  "1m": "30 dias",
  "3m": "3 meses",
  "6m": "6 meses",
  "12m": "12 meses",
  ytd: "Ano",
};
