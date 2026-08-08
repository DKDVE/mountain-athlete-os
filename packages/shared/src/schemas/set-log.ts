import { z } from 'zod';

export const SetLog = z.object({
  clientId: z.string(),
  sessionId: z.string().uuid(),
  exerciseId: z.string(),
  setNo: z.number().int().positive(),
  weightKg: z.number().nonnegative().nullable(),
  reps: z.number().int().nonnegative().nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  tempo: z.string().nullable(),
  isWarmup: z.boolean().default(false),
  isDropset: z.boolean().default(false),
  pain: z.object({ region: z.string(), severity: z.number().min(0).max(10) }).nullable(),
  note: z.string().nullable(),
});

export type SetLog = z.infer<typeof SetLog>;
