import { z } from 'zod';
import { SessionStatus, SessionTypeSchema, PlannedSessionSchema } from './common.js';

export const Session = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  programId: z.string().uuid().nullable(),
  date: z.string(),
  type: SessionTypeSchema,
  title: z.string(),
  planned: PlannedSessionSchema,
  status: SessionStatus.default('upcoming'),
  sessionRpe: z.number().min(1).max(10).nullable(),
  energy: z.number().int().min(1).max(10).nullable(),
  pump: z.number().int().min(1).max(10).nullable(),
  note: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  clientId: z.string().nullable(),
});

export type Session = z.infer<typeof Session>;
