import { z } from 'zod';
import { RunTypeSchema } from './common.js';

export const Run = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(),
  type: RunTypeSchema,
  distanceM: z.number().int().nonnegative().nullable(),
  durationS: z.number().int().nonnegative().nullable(),
  avgHr: z.number().int().nonnegative().nullable(),
  maxHr: z.number().int().nonnegative().nullable(),
  cadence: z.number().int().nonnegative().nullable(),
  elevGainM: z.number().int().nonnegative().nullable(),
  splits: z.record(z.string(), z.unknown()).nullable(),
  zones: z.record(z.string(), z.unknown()).nullable(),
  weather: z.record(z.string(), z.unknown()).nullable(),
  gpsRef: z.string().nullable(),
  shoeId: z.string().uuid().nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  note: z.string().nullable(),
  clientId: z.string().nullable(),
});

export type Run = z.infer<typeof Run>;
