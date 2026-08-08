import Dexie, { type Table } from 'dexie';

export interface OutboxRow {
  clientId: string;
  table: string;
  op: 'insert' | 'update' | 'upsert';
  payload: Record<string, unknown>;
  ts: number;
}

export interface WorkoutStateRow {
  sessionId: string;
  stepIndex: number;
  elapsedS: number;
  restEndsAt: number | null;
  loggedSets: LoggedSetRow[];
  startedAt: string;
  drawerExerciseId: string | null;
}

export interface LoggedSetRow {
  clientId: string;
  exerciseId: string;
  setNo: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  isDropset: boolean;
  pain: { region: string; severity: number } | null;
  note: string | null;
}

export class MaosDexie extends Dexie {
  outbox!: Table<OutboxRow, string>;
  workoutState!: Table<WorkoutStateRow, string>;

  constructor() {
    super('maos');
    this.version(1).stores({
      outbox: 'clientId, ts',
      workoutState: 'sessionId',
    });
    this.version(2).stores({
      outbox: 'clientId, ts',
      workoutState: 'sessionId',
    });
  }
}

export const maosDb = new MaosDexie();
