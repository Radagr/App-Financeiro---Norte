import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { computeGoalStatus, monthlyContributionRequired } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

import { protectedProcedure, router } from "../trpc";

const goalTypeSchema = z.enum([
  "emergency",
  "trip",
  "house",
  "vehicle",
  "retirement",
  "education",
  "custom",
]);

export const goalsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await prisma.goal.findMany({
      where: { userId: ctx.user.id },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
    });
    return rows.map((g) => {
      const target = Number(g.target);
      const current = Number(g.current);
      const status = computeGoalStatus({ target, current, deadline: g.deadline });
      const monthlyRequired = monthlyContributionRequired({
        target,
        current,
        deadline: g.deadline,
      });
      return {
        id: g.id,
        name: g.name,
        type: g.type,
        target,
        current,
        deadline: g.deadline,
        priority: g.priority,
        linkedAccountId: g.linkedAccountId,
        status,
        monthlyRequired,
        progressPct: target === 0 ? 0 : Math.min(100, (current / target) * 100),
      };
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(80),
        type: goalTypeSchema.default("custom"),
        target: z.number().positive(),
        current: z.number().min(0).default(0),
        deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        priority: z.number().int().min(1).max(5).default(1),
        linkedAccountId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const goal = await prisma.goal.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          target: input.target,
          current: input.current,
          deadline: new Date(input.deadline),
          priority: input.priority,
          linkedAccountId: input.linkedAccountId ?? null,
        },
      });
      return { id: goal.id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(80).optional(),
        type: goalTypeSchema.optional(),
        target: z.number().positive().optional(),
        current: z.number().min(0).optional(),
        deadline: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        priority: z.number().int().min(1).max(5).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.goal.findUnique({ where: { id: input.id } });
      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const { id, deadline, ...rest } = input;
      await prisma.goal.update({
        where: { id },
        data: {
          ...rest,
          ...(deadline ? { deadline: new Date(deadline) } : {}),
        },
      });
      return { ok: true as const };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.goal.findUnique({ where: { id: input.id } });
      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await prisma.goal.delete({ where: { id: input.id } });
      return { ok: true as const };
    }),

  contribute: protectedProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        amount: z.number().positive(),
        note: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const goal = await prisma.goal.findUnique({ where: { id: input.goalId } });
      if (!goal || goal.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await prisma.$transaction([
        prisma.goalContribution.create({
          data: { goalId: input.goalId, amount: input.amount, note: input.note ?? null },
        }),
        prisma.goal.update({
          where: { id: input.goalId },
          data: { current: { increment: input.amount } },
        }),
      ]);
      return { ok: true as const };
    }),
});
