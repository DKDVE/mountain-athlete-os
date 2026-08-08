import { z } from 'zod';

export const Measurement = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(),
  site: z.string(),
  valueCm: z.number().nonnegative(),
});

export type Measurement = z.infer<typeof Measurement>;
