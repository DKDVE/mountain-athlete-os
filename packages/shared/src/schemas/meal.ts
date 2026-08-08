import { z } from 'zod';

export const Meal = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  ts: z.string(),
  foodId: z.string(),
  portions: z.number().positive(),
  proteinG: z.number().nonnegative(),
  kcal: z.number().nonnegative(),
  clientId: z.string().nullable(),
});

export type Meal = z.infer<typeof Meal>;
