export type Tier = "free" | "plus" | "pro";

export type SubscriptionState = {
  subscriptionTier: string;
  trialEndsAt: Date | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * Computes the effective tier for a user at a given point in time.
 * Priority: active subscription > active trial > free.
 * `now` is injectable for testing; defaults to current time.
 */
export function getEffectiveTier(state: SubscriptionState, now: Date = new Date()): Tier {
  if (state.stripeSubscriptionId && state.subscriptionStatus) {
    if (ACTIVE_STATUSES.has(state.subscriptionStatus)) {
      return normalizeTier(state.subscriptionTier);
    }
    if (
      state.subscriptionStatus === "canceled" &&
      state.subscriptionEndsAt &&
      state.subscriptionEndsAt > now
    ) {
      return normalizeTier(state.subscriptionTier);
    }
  }

  if (state.trialEndsAt && state.trialEndsAt > now) {
    return "plus";
  }

  return "free";
}

function normalizeTier(tier: string): Tier {
  return tier === "plus" || tier === "pro" ? tier : "free";
}
