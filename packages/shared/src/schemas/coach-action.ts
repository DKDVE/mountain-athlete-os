import { z } from 'zod';

export const CoachActionKind = z.enum([
  'swap_exercise',
  'scale_session',
  'move_session',
  'set_flag',
  'message_only',
]);

export const SwapExercisePayload = z.object({
  sessionId: z.string().uuid(),
  fromExerciseId: z.string(),
  toExerciseId: z.string(),
  reason: z.string().optional(),
});

export const ScaleSessionPayload = z.object({
  sessionId: z.string().uuid(),
  volumeMultiplier: z.number().min(0.1).max(2),
  intensityDeltaRpe: z.number().min(-3).max(3).optional(),
});

export const MoveSessionPayload = z.object({
  sessionId: z.string().uuid(),
  newDate: z.string(),
});

export const SetFlagPayload = z.object({
  flag: z.string(),
  value: z.boolean(),
});

export const MessageOnlyPayload = z.object({
  text: z.string(),
});

export const CoachAction = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('swap_exercise'),
    payload: SwapExercisePayload,
    humanSummary: z.string(),
  }),
  z.object({
    kind: z.literal('scale_session'),
    payload: ScaleSessionPayload,
    humanSummary: z.string(),
  }),
  z.object({
    kind: z.literal('move_session'),
    payload: MoveSessionPayload,
    humanSummary: z.string(),
  }),
  z.object({
    kind: z.literal('set_flag'),
    payload: SetFlagPayload,
    humanSummary: z.string(),
  }),
  z.object({
    kind: z.literal('message_only'),
    payload: MessageOnlyPayload,
    humanSummary: z.string(),
  }),
]);

export type CoachAction = z.infer<typeof CoachAction>;
