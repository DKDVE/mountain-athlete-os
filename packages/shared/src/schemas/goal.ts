import { z } from 'zod';

export const GoalStatus = z.enum(['active', 'completed', 'abandoned']);

export const Goal = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  target: z.record(z.string(), z.unknown()),
  deadline: z.string().nullable(),
  status: GoalStatus.default('active'),
});

export type Goal = z.infer<typeof Goal>;
