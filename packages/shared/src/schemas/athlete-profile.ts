import { z } from 'zod';

export const AthleteGoal = z.enum([
  'fat_loss',
  'recomposition',
  'hypertrophy',
  'strength',
  'endurance',
  'hybrid_performance',
  'event_specific',
  'mobility_pain',
  'longevity',
  'glp1_preservation',
]);
export type AthleteGoal = z.infer<typeof AthleteGoal>;

export const ExperienceLevel = z.enum(['beginner', 'returning', 'intermediate', 'advanced']);
export type ExperienceLevel = z.infer<typeof ExperienceLevel>;

export const Equipment = z.enum([
  'barbell',
  'dumbbell',
  'rack',
  'bench',
  'pull_up_bar',
  'cable',
  'machine',
  'band',
  'bodyweight',
  'treadmill',
  'outdoor',
]);
export type Equipment = z.infer<typeof Equipment>;

export const ScreeningFlag = z.enum([
  'cardiac',
  'metabolic',
  'renal',
  'pregnancy',
  'current_injury',
  'recent_surgery',
  'uncontrolled_bp',
  'chronic_condition_other',
]);
export type ScreeningFlag = z.infer<typeof ScreeningFlag>;

export const ScreeningEntry = z.object({
  flag: ScreeningFlag,
  region: z.string().optional(),
  note: z.string().optional(),
});
export type ScreeningEntry = z.infer<typeof ScreeningEntry>;

export const LiftSnapshot = z.object({
  weightKg: z.number().nonnegative().nullable(),
  reps: z.number().int().nonnegative().nullable(),
});

export const AthleteProfile = z.object({
  goals: z.array(AthleteGoal).min(1),
  experience: ExperienceLevel,
  constraints: z.object({
    daysPerWeek: z.number().int().min(1).max(7),
    sessionMinutes: z.number().int().min(20).max(180),
    equipment: z.array(Equipment),
    schedule: z.string().optional(),
  }),
  screening: z.object({
    flags: z.array(ScreeningEntry).default([]),
  }),
  preferences: z.object({
    likedMovements: z.array(z.string()).default([]),
    dislikedMovements: z.array(z.string()).default([]),
    dietaryPattern: z.string().nullable().optional(),
    wearableOwned: z.string().nullable().optional(),
  }),
  metricsSnapshot: z
    .object({
      heightCm: z.number().positive().nullable().optional(),
      weightKg: z.number().positive().nullable().optional(),
      waistCm: z.number().positive().nullable().optional(),
      currentLifts: z.record(z.string(), LiftSnapshot).optional(),
    })
    .default({}),
});
export type AthleteProfile = z.infer<typeof AthleteProfile>;

/** Goals that cannot be auto-generated — show consult-professional state. */
export const UNSUPPORTED_GOALS: readonly AthleteGoal[] = [
  'longevity',
  'glp1_preservation',
  'mobility_pain',
];

/** Screening flags that block auto-generation entirely. */
export const BLOCKING_SCREENING_FLAGS: readonly ScreeningFlag[] = ['pregnancy', 'cardiac'];

export function hasScreeningFlags(profile: AthleteProfile): boolean {
  return profile.screening.flags.length > 0;
}

export function programGenerationBlocked(profile: AthleteProfile): boolean {
  const primary = profile.goals[0];
  if (primary && (UNSUPPORTED_GOALS as readonly string[]).includes(primary)) return true;
  return profile.screening.flags.some((f) =>
    (BLOCKING_SCREENING_FLAGS as readonly string[]).includes(f.flag),
  );
}
