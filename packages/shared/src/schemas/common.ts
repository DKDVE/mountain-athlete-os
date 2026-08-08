import { z } from 'zod';

export const PainEntry = z.object({
  region: z.string(),
  severity: z.number().min(0).max(10),
});

export const SorenessEntry = z.object({
  region: z.string(),
  severity: z.number().min(0).max(10),
});

export const SessionStatus = z.enum(['upcoming', 'in_progress', 'done', 'skipped']);
export const SessionTypeSchema = z.enum(['lower', 'upper', 'fullbody', 'run', 'mobility', 'rest']);
export const RunTypeSchema = z.enum(['z2', 'tempo', 'interval', 'long', 'hike', 'walkrun']);

export type SessionType = z.infer<typeof SessionTypeSchema>;
export type RunType = z.infer<typeof RunTypeSchema>;

export const PlannedSet = z.object({
  setNo: z.number().int().positive(),
  reps: z.number().int().nonnegative().nullable(),
  weightKg: z.number().nonnegative().nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  tempo: z.string().nullable(),
  isWarmup: z.boolean().default(false),
  isDropset: z.boolean().default(false),
});

export const PlannedExercise = z.object({
  exerciseId: z.string(),
  sets: z.array(PlannedSet),
  supersetWith: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const PlannedRun = z.object({
  type: RunTypeSchema,
  distanceM: z.number().int().nonnegative().nullable(),
  durationS: z.number().int().nonnegative().nullable(),
  targetHrZone: z.number().int().min(1).max(5).nullable().optional(),
  note: z.string().nullable().optional(),
});

export const PlannedSessionSchema = z.object({
  exercises: z.array(PlannedExercise).default([]),
  run: PlannedRun.nullable().optional(),
  mobility: z.array(z.string()).default([]),
});

export type PlannedSession = z.infer<typeof PlannedSessionSchema>;
