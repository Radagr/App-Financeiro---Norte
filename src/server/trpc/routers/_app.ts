import { router } from "../trpc";

import { authRouter } from "./auth";
import { goalsRouter } from "./goals";
import { healthRouter } from "./health";

export const appRouter = router({
  auth: authRouter,
  goals: goalsRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
