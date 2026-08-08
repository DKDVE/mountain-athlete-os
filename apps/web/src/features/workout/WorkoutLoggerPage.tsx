import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { PlannedSessionSchema, suggestWeight } from '@maos/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberStepper } from '@/components/ui/number-stepper';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { maosDb, type LoggedSetRow, type WorkoutStateRow } from '@/lib/db';
import { enqueueInsert, enqueueUpdate } from '@/lib/sync/outbox';
import { flushOutbox } from '@/lib/sync/flush';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/features/workout/session-queries';
import { useAuthStore } from '@/stores/auth-store';
import { useConnectivityStore } from '@/stores/connectivity-store';
import { RestTimer } from '@/features/workout/RestTimer';
import {
  dropsetWeightKg,
  formatDuration,
  perExerciseDeltas,
  tonnageKg,
} from '@/features/workout/workout-utils';
import { buildWorkoutSteps, toggleSupersetStepIndex } from '@/features/workout/workout-steps';
import { exerciseName } from '@/features/workout/exercise-meta';
import { useLastExerciseSet } from '@/features/workout/exercise-history';
import { ExerciseDetailDrawer, PainSheet } from '@/features/workout/ExerciseDrawers';

const REST_DEFAULT_S = 90;

function defaultState(sessionId: string): WorkoutStateRow {
  return {
    sessionId,
    stepIndex: 0,
    elapsedS: 0,
    restEndsAt: null,
    loggedSets: [],
    startedAt: new Date().toISOString(),
    drawerExerciseId: null,
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
  const [energy, setEnergy] = useState(3);
  const [pump, setPump] = useState(3);
  const [painOpen, setPainOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [restDurationS, setRestDurationS] = useState(REST_DEFAULT_S);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loggedClientIdsRef = useRef<string[]>([]);

  const session = sessionQuery.data;
  const planned = session ? PlannedSessionSchema.safeParse(session.planned) : null;
  const exercises = planned?.success ? planned.data.exercises : [];
  const steps = buildWorkoutSteps(exercises);

  useEffect(() => {
    if (!sessionId) return;
    setState(defaultState(sessionId));
    void maosDb.workoutState.get(sessionId).then((saved) => {
      if (!saved) return;
      if ('stepIndex' in saved) {
        setState(saved);
        return;
      }
      const raw = saved as unknown as Record<string, unknown>;
      if (raw.exerciseIndex != null && raw.setIndex != null && planned?.success) {
        const stepsLocal = buildWorkoutSteps(planned.data.exercises);
        const legacy = saved as WorkoutStateRow & { exerciseIndex?: number; setIndex?: number };
        if (legacy.exerciseIndex != null && legacy.setIndex != null) {
          const idx = stepsLocal.findIndex(
            (s) => s.exerciseIndex === legacy.exerciseIndex && s.setIndex === legacy.setIndex,
          );
          setState({
            sessionId,
            stepIndex: idx >= 0 ? idx : 0,
            elapsedS: legacy.elapsedS,
            restEndsAt: legacy.restEndsAt,
            loggedSets: legacy.loggedSets,
            startedAt: legacy.startedAt,
            drawerExerciseId: null,
          });
          return;
        }
      }
      setState(defaultState(sessionId));
    });
  }, [sessionId, planned]);

  useEffect(() => {
    if (!state) return;
    timerRef.current = setInterval(() => {
      setState((prev) => (prev ? { ...prev, elapsedS: prev.elapsedS + 1 } : prev));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state?.sessionId, state]);

  const persistState = useCallback(async (next: WorkoutStateRow) => {
    await maosDb.workoutState.put(next);
    setState(next);
  }, []);

  const stepIndex = state?.stepIndex ?? 0;
  const currentStep = steps[stepIndex];
  const currentEx = currentStep ? exercises[currentStep.exerciseIndex] : undefined;
  const currentSet = currentStep ? currentEx?.sets[currentStep.setIndex] : undefined;
  const lastSetQuery = useLastExerciseSet(currentEx?.exerciseId ?? null);

  useEffect(() => {
    if (!currentSet || !currentEx) return;
    const last = lastSetQuery.data;
    const ghost = suggestWeight({
      lastWeightKg: last?.weightKg ?? currentSet.weightKg ?? 0,
      lastReps: last?.reps ?? currentSet.reps ?? 0,
      targetReps: currentSet.reps ?? 8,
      lastRpe: last?.rpe ?? currentSet.rpe,
      readiness: null,
      userOverrideKg: null,
    });
    setWeight(ghost);
    setReps(currentSet.reps ?? 8);
    setRpe(currentSet.rpe ?? 7);
  }, [stepIndex, currentEx?.exerciseId, currentSet?.setNo, currentSet, currentEx, lastSetQuery.data]);

  async function logCurrentSet(opts?: {
    isDropset?: boolean;
    pain?: LoggedSetRow['pain'];
  }) {
    if (!currentEx || !currentSet || !currentStep || !sessionId || !userId || !state) return;

    const logWeight = opts?.isDropset ? dropsetWeightKg(weight) : weight;
    const clientId = await enqueueInsert('set_logs', {
      session_id: sessionId,
      exercise_id: currentEx.exerciseId,
      set_no: currentSet.setNo,
      weight_kg: logWeight,
      reps,
      rpe,
      is_warmup: currentSet.isWarmup,
      is_dropset: opts?.isDropset ?? false,
      pain: opts?.pain ?? null,
      note: null,
    });
    loggedClientIdsRef.current.push(clientId);

    const row: LoggedSetRow = {
      clientId,
      exerciseId: currentEx.exerciseId,
      setNo: currentSet.setNo,
      weightKg: logWeight,
      reps,
      rpe,
      isWarmup: currentSet.isWarmup,
      isDropset: opts?.isDropset ?? false,
      pain: opts?.pain ?? null,
      note: null,
    };

    const nextStepIndex = stepIndex + 1;
    const startRest =
      !currentSet.isWarmup && currentStep.isLastInSupersetRound;

    const next: WorkoutStateRow = {
      ...state,
      stepIndex: nextStepIndex,
      loggedSets: [...state.loggedSets, row],
      restEndsAt: startRest ? Date.now() + restDurationS * 1000 : state.restEndsAt,
    };
    await persistState(next);
    setFlash(true);
    setTimeout(() => {
      setFlash(false);
    }, 400);
    if (online) {
      void flushOutbox(supabase, userId);
    }
  }

  async function finishSession() {
    if (!sessionId || !userId) return;
    setFinishing(true);
    await enqueueUpdate('sessions', {
      id: sessionId,
      status: 'done',
      session_rpe: sessionRpe,
      energy,
      pump,
      finished_at: new Date().toISOString(),
    });
    if (online) await flushOutbox(supabase, userId);
    await maosDb.workoutState.delete(sessionId);
    void navigate('/', { replace: true });
  }

  function adjustRest(deltaS: number) {
    if (!state?.restEndsAt) return;
    const nextEnds = state.restEndsAt + deltaS * 1000;
    setRestDurationS((d) => Math.max(15, d + deltaS));
    void persistState({ ...state, restEndsAt: nextEnds });
  }

  if (!sessionId) {
    return <EmptyState title="No session" description="Missing session id." />;
  }

  if (sessionQuery.isLoading) {
    return <p className="text-muted-foreground">Loading session…</p>;
  }

  if (!state) {
    return null;
  }

  if (!session || !planned?.success || exercises.length === 0) {
    return <EmptyState title="Session not found" description="Could not load planned workout." />;
  }

  const completedCount = state.loggedSets.length;
  const totalSets = steps.length;
  const mins = Math.floor(state.elapsedS / 60);
  const secs = state.elapsedS % 60;
  const deltas = perExerciseDeltas(state.loggedSets);
  const drawerOpen = Boolean(state.drawerExerciseId);

  return (
    <div
      className="space-y-4 pb-24"
      data-testid="workout-logger"
      onKeyDown={(e) => {
        if (
          e.key === 'Enter' &&
          !e.shiftKey &&
          currentStep &&
          !finishing &&
          (e.target as HTMLElement).tagName !== 'INPUT'
        ) {
          e.preventDefault();
          void logCurrentSet();
        }
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">{session.title}</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalSets} sets · {String(mins).padStart(2, '0')}:
            {String(secs).padStart(2, '0')}
          </p>
        </div>
        <Chip>{session.type}</Chip>
      </div>

      {currentStep && currentEx && currentSet ? (
        <Card className={flash ? 'border-success/50 bg-success/5 transition-colors' : undefined}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {exerciseName(currentEx.exerciseId)}
                  {currentStep.supersetLabel ? (
                    <Chip variant="outline">{currentStep.supersetLabel}</Chip>
                  ) : null}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set {currentSet.setNo} · target {currentSet.reps ?? '—'} reps @ RPE{' '}
                  {currentSet.rpe ?? '—'}
                  {currentSet.isWarmup ? ' · warm-up' : ''}
                </p>
                {lastSetQuery.data ? (
                  <p className="text-xs text-muted-foreground">
                    Last: {lastSetQuery.data.weightKg} kg × {lastSetQuery.data.reps} on{' '}
                    {lastSetQuery.data.date}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No prior logged sets for this lift.</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                aria-label="Exercise details"
                onClick={() => {
                  void persistState({ ...state, drawerExerciseId: currentEx.exerciseId });
                }}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            {currentStep.supersetLabel ? (
              <div className="mt-3">
                <Segmented
                  value={currentStep.supersetLabel}
                  options={[
                    { value: 'A1', label: 'A1' },
                    { value: 'A2', label: 'A2' },
                  ]}
                  onChange={(label) => {
                    if (label === currentStep.supersetLabel) return;
                    const nextIdx = toggleSupersetStepIndex(steps, stepIndex);
                    void persistState({ ...state, stepIndex: nextIdx });
                  }}
                />
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <NumberStepper label="kg" value={weight} onChange={setWeight} step={2.5} min={0} />
              <NumberStepper label="reps" value={reps} onChange={setReps} step={1} min={0} />
              <NumberStepper label="RPE" value={rpe} onChange={setRpe} step={1} min={1} max={10} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button data-testid="complete-set" onClick={() => void logCurrentSet()}>
                Complete set
              </Button>
              <Button
                variant="outline"
                data-testid="dropset"
                onClick={() => void logCurrentSet({ isDropset: true })}
              >
                Dropset (−20%)
              </Button>
              <Button
                variant="outline"
                data-testid="log-pain"
                onClick={() => {
                  setPainOpen(true);
                }}
              >
                Log pain
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card data-testid="finish-summary">
          <CardHeader>
            <CardTitle>Session complete</CardTitle>
            <p className="text-sm text-muted-foreground">
              {state.loggedSets.length} sets · {formatDuration(state.elapsedS)} ·{' '}
              {Math.round(tonnageKg(state.loggedSets))} kg tonnage
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {deltas.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {deltas.map((d) => (
                  <li key={d.exerciseId}>
                    {exerciseName(d.exerciseId)}: {d.setsLogged} sets · {Math.round(d.tonnageKg)} kg
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No working sets" description="You logged warm-ups only or skipped sets." />
            )}
            <p className="text-sm text-muted-foreground">Rate session RPE and recovery to finish.</p>
            <NumberStepper
              label="Session RPE"
              value={sessionRpe}
              onChange={setSessionRpe}
              step={1}
              min={1}
              max={10}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberStepper label="Energy" value={energy} onChange={setEnergy} step={1} min={1} max={5} />
              <NumberStepper label="Pump" value={pump} onChange={setPump} step={1} min={1} max={5} />
            </div>
            <Button disabled={finishing} data-testid="finish-session" onClick={() => void finishSession()}>
              Finish & return to Today
            </Button>
          </CardContent>
        </Card>
      )}

      {state.restEndsAt ? (
        <RestTimer
          endsAt={state.restEndsAt}
          initialDurationS={restDurationS}
          onSkip={() => {
            void persistState({ ...state, restEndsAt: null });
          }}
          onAdjust={adjustRest}
        />
      ) : null}

      <PainSheet
        open={painOpen}
        onClose={() => {
          setPainOpen(false);
        }}
        onConfirm={(pain) => {
          void logCurrentSet({ pain });
        }}
      />

      <ExerciseDetailDrawer
        exerciseId={state.drawerExerciseId}
        open={drawerOpen}
        onClose={() => {
          void persistState({ ...state, drawerExerciseId: null });
        }}
      />
    </div>
  );
}
