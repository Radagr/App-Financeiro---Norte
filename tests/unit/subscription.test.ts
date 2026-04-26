import { describe, expect, it } from "vitest";

import { getEffectiveTier, type SubscriptionState } from "@/lib/subscription";

const NOW = new Date("2026-04-25T12:00:00Z");
const FUTURE = new Date("2026-05-10T12:00:00Z");
const PAST = new Date("2026-04-20T12:00:00Z");

describe("getEffectiveTier", () => {
  it("returns 'free' for user without subscription or trial", () => {
    const state: SubscriptionState = {
      subscriptionTier: "free",
      trialEndsAt: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionEndsAt: null,
    };
    expect(getEffectiveTier(state, NOW)).toBe("free");
  });

  it("returns 'plus' during active trial", () => {
    const state: SubscriptionState = {
      subscriptionTier: "free",
      trialEndsAt: FUTURE,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionEndsAt: null,
    };
    expect(getEffectiveTier(state, NOW)).toBe("plus");
  });

  it("returns 'free' when trial has ended without conversion", () => {
    const state: SubscriptionState = {
      subscriptionTier: "free",
      trialEndsAt: PAST,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionEndsAt: null,
    };
    expect(getEffectiveTier(state, NOW)).toBe("free");
  });

  it("returns subscription tier when status is active", () => {
    const state: SubscriptionState = {
      subscriptionTier: "pro",
      trialEndsAt: null,
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "active",
      subscriptionEndsAt: FUTURE,
    };
    expect(getEffectiveTier(state, NOW)).toBe("pro");
  });

  it("returns subscription tier during grace period (past_due)", () => {
    const state: SubscriptionState = {
      subscriptionTier: "plus",
      trialEndsAt: null,
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "past_due",
      subscriptionEndsAt: FUTURE,
    };
    expect(getEffectiveTier(state, NOW)).toBe("plus");
  });

  it("downgrades to free when subscription canceled and period ended", () => {
    const state: SubscriptionState = {
      subscriptionTier: "plus",
      trialEndsAt: null,
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "canceled",
      subscriptionEndsAt: PAST,
    };
    expect(getEffectiveTier(state, NOW)).toBe("free");
  });

  it("keeps tier through end of period when canceled but still inside period", () => {
    const state: SubscriptionState = {
      subscriptionTier: "plus",
      trialEndsAt: null,
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "canceled",
      subscriptionEndsAt: FUTURE,
    };
    expect(getEffectiveTier(state, NOW)).toBe("plus");
  });
});
