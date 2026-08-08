import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PlannedSessionSchema, suggestWeight } from '@maos/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberStepper } from '@/components/ui/number-stepper';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { maosDb, type LoggedSetRow, type WorkoutStateRow } from '@/lib/db';
import { enqueueInsert, enqueueUpdate } from '@/lib/sync/outbox';
import { flushOutbox } from '@/lib/sync/flush';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/features/workout/session-queries';
import { useAuthStore } from '@/stores/auth-store';
import { useConnectivityStore } from '@/stores/connectivity-store';
import { RestTimer } from '@/features/workout/RestTimer';
import { tonnageKg, formatDuration } from '@/features/workout/workout-utils';

function defaultState(sessionId: string): WorkoutStateRow {
  return {
    sessionId,
    exerciseIndex: 0,
    setIndex: 0,
    elapsedS: 0,
    restEndsAt: null,
    loggedSets: [],
    startedAt: new Date().toISOString(),
  };
}

export function WorkoutLoggerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const online = useConnectivityStore((s) => s.online);
  const sessionQuery = useSession(sessionId);
  const [state, setState] = useState<WorkoutStateRow | null>(null);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState(7);
  const [finishing, setFinishing] = useState(false);
  const [sessionRpe, setSessionRpe] = useState(7);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    void maosDb.workoutState.get(sessionId).then((saved) => {
      setState(saved ?? defaultState(sessionId));
    });
  }, [sessionId]);

  useEffect(() => {
    if (!state) return;
    timerRef.current = setInterval(() => {
      setState((prev) => (prev ? { ...prev, elapsedS: prev.elapsedS + 1 } : prev));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const persistState = useCallback(async (next: WorkoutStateRow) => {
    await maosDb.workoutState.put(next);
    setState(next);
  }, []);

  const session = sessionQuery.data;
  const planned = session ? PlannedSessionSchema.safeParse(session.planned) : null;
  const exercises = planned?.success ? planned.data.exercises : [];
  const currentEx = exercises[state?.exerciseIndex ?? 0];
  const currentSet = currentEx?.sets[state?.setIndex ?? 0];

  useEffect(() => {
    if (!currentSet) return;
    const ghost = suggestWeight({
      lastWeightKg: currentSet.weightKg ?? 0,
      lastReps: currentSet.reps ?? 0,
      targetReps: currentSet.reps ?? 8,
      lastRpe: currentSet.rpe,
      readiness: null,
      userOverrideKg: null,
    });
    setWeight(ghost);
    setReps(currentSet.reps ?? 8);
    setRpe(currentSet.rpe ?? 7);
  }, [state, currentEx?.exerciseId, currentSet?.setNo, currentEx, currentSet]);

  if (!sessionId) {
    return <EmptyState title="No session" description="Missing session id." />;
  }

  if (sessionQuery.isLoading || !state) {
    return <p className="text-muted-foreground">Loading session…</p>;
  }

  if (!session || !planned?.success || exercises.length === 0) {
    return <EmptyState title="Session not found" description="Could not load planned workout." />;
  }

  const completedCount = state.loggedSets.length;
  const totalSets = exercises.reduce((n, ex) => n + ex.sets.length, 0);

  async function logCurrentSet(opts?: { isDropset?: boolean; pain?: LoggedSetRow['pain'] }) {
    if (!currentEx || !currentSet || !sessionId || !userId || !state) return;
    const clientId = await enqueueInsert('set_logs', {
      session_id: sessionId,
      exercise_id: currentEx.exerciseId,
      set_no: currentSet.setNo,
      weight_kg: weight,
      reps,
      rpe,
      is_warmup: currentSet.isWarmup,
      is_dropset: opts?.isDropset ?? false,
      pain: opts?.pain ?? null,
      note: null,
    });

    const row: LoggedSetRow = {
      clientId,
      exerciseId: currentEx.exerciseId,
      setNo: currentSet.setNo,
      weightKg: weight,
      reps,
      rpe,
      isWarmup: currentSet.isWarmup,
      isDropset: opts?.isDropset ?? false,
      pain: opts?.pain ?? null,
      note: null,
    };

    let nextSetIndex = state.setIndex + 1;
    let nextExerciseIndex = state.exerciseIndex;
    if (nextSetIndex >= currentEx.sets.length) {
      nextExerciseIndex += 1;
      nextSetIndex = 0;
    }

    const next: WorkoutStateRow = {
      ...state,
      exerciseIndex: nextExerciseIndex,
      setIndex: nextSetIndex,
      loggedSets: [...state.loggedSets, row],
      restEndsAt: currentSet.isWarmup ? null : Date.now() + 90_000,
    };
    await persistState(next);
    if (online) void flushOutbox(supabase, userId);
  }

  async function finishSession(sessionRpe: number) {
    if (!sessionId || !userId) return;
    setFinishing(true);
    await enqueueUpdate('sessions', {
      id: sessionId,
      status: 'done',
      session_rpe: sessionRpe,
      finished_at: new Date().toISOString(),
    });
    if (online) await flushOutbox(supabase, userId);
    await maosDb.workoutState.delete(sessionId);
    void navigate('/', { replace: true });
  }

  const mins = Math.floor(state.elapsedS / 60);
  const secs = state.elapsedS % 60;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">{session.title}</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalSets} sets · {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
        </div>
        <Chip>{session.type}</Chip>
      </div>

      {currentEx ? (
        <Card>
          <CardHeader>
            <CardTitle>{currentEx.exerciseId.replace(/-/g, ' ')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set {currentSet?.setNo ?? 1} · target {currentSet?.reps ?? '—'} reps
              {currentSet?.isWarmup ? ' · warm-up' : ''}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <NumberStepper label="kg" value={weight} onChange={setWeight} step={2.5} min={0} />
              <NumberStepper label="reps" value={reps} onChange={setReps} step={1} min={0} />
              <NumberStepper label="RPE" value={rpe} onChange={setRpe} step={1} min={1} max={10} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void logCurrentSet()}>Complete set</Button>
              <Button variant="outline" onClick={() => void logCurrentSet({ isDropset: true })}>
                Dropset (−20%)
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  void logCurrentSet({ pain: { region: 'knee', severity: 3 } })
                }
              >
                Log pain
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Session complete</CardTitle>
            <p className="text-sm text-muted-foreground">
              {state.loggedSets.length} sets · {formatDuration(state.elapsedS)} ·{' '}
              {Math.round(tonnageKg(state.loggedSets))} kg tonnage
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Rate session RPE to finish.</p>
            <NumberStepper label="Session RPE" value={sessionRpe} onChange={setSessionRpe} step={1} min={1} max={10} />
            <Button disabled={finishing} onClick={() => void finishSession(sessionRpe)}>
              Finish & return to Today
            </Button>
          </CardContent>
        </Card>
      )}

      {state.restEndsAt ? (
        <RestTimer
          endsAt={state.restEndsAt}
          onSkip={() => {
            void persistState({ ...state, restEndsAt: null });
          }}
        />
      ) : null}
    </div>
  );
}
