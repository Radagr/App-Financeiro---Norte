import { describe, expect, it } from "vitest";

import { appRouter } from "@/server/trpc/routers/_app";

describe("auth.whoami", () => {
  it("returns null user when context has no auth", async () => {
    const caller = appRouter.createCaller({ user: null });
    const result = await caller.auth.whoami();
    expect(result).toEqual({ user: null });
  });

  it("returns user payload when context has auth user", async () => {
    const caller = appRouter.createCaller({
      user: { id: "abc-123", email: "test@example.com" },
    });
    const result = await caller.auth.whoami();
    expect(result.user).toEqual({ id: "abc-123", email: "test@example.com" });
  });
});
