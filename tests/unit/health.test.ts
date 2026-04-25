import { describe, it, expect } from "vitest";
import { appRouter } from "@/server/trpc/routers/_app";

describe("health.ping", () => {
  it("returns ok=true with a numeric timestamp", async () => {
    const caller = appRouter.createCaller({ user: null });
    const result = await caller.health.ping();

    expect(result.ok).toBe(true);
    expect(typeof result.ts).toBe("number");
    expect(result.ts).toBeGreaterThan(0);
  });
});
