import { z } from 'zod';
import { SorenessEntry } from './common.js';

export const Checkin = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(),
  sleepH: z.number().nonnegative().nullable(),
  quality: z.number().int().min(1).max(10).nullable(),
  energy: z.number().int().min(1).max(10).nullable(),
  stress: z.number().int().min(1).max(10).nullable(),
  rhr: z.number().int().nonnegative().nullable(),
  soreness: z.array(SorenessEntry).default([]),
});

export type Checkin = z.infer<typeof Checkin>;
