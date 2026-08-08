import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import {
  estimateDurationMinutes,
  exercisePreview,
  greetingForHour,
  isEvening,
  addDaysLocal,
} from '@/features/program/program-utils';
import {
  useActiveProgram,
  useDailyMetrics,
  useProgramContext,
  useProteinToday,
  useSessionsForDate,
  useTodayDate,
  useTrainingStreak,
  useWeeklyLoad,
  type SessionRow,
} from '@/features/program/program-queries';
import { PlannedSessionSchema } from '@maos/shared';
import { useConnectivityStore } from '@/stores/connectivity-store';
import { MetricCard } from '@/components/ui/metric-card';
import { RingProgress } from '@/components/ui/ring-progress';
import { TodaySkeleton } from '@/features/today/TodaySkeleton';

function SessionHero({ session }: { session: SessionRow }) {
  const planned = PlannedSessionSchema.safeParse(session.planned);
  const duration = planned.success ? estimateDurationMinutes(planned.data) : null;
  const preview = planned.success ? exercisePreview(planned.data) : [];

  if (session.type === 'rest') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rest day</CardTitle>
          <p className="text-sm text-muted-foreground">Recovery is part of the program.</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Mobility, sleep, and protein still count today.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{session.title}</CardTitle>
          <Chip variant="outline">{session.type}</Chip>
        </div>
        <p className="text-sm text-muted-foreground">
          {duration ? `~${String(duration)} min` : 'Duration TBD'}
          {preview.length ? ` · ${preview.join(', ')}` : null}
        </p>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to={`/train/log/${session.id}`}>Start session</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function TodayPage() {
  const today = useTodayDate();
  const online = useConnectivityStore((s) => s.online);
  const programQuery = useActiveProgram();
  const sessionsQuery = useSessionsForDate(today);
  const metricsQuery = useDailyMetrics(today);
  const proteinQuery = useProteinToday(today);
  const loadQuery = useWeeklyLoad(today);
  const streakQuery = useTrainingStreak(today);

  const program = programQuery.data;
  const context = useProgramContext(program, today);
  const sessions = sessionsQuery.data ?? [];
  const primarySession =
    sessions.find((s) => s.type !== 'rest') ?? sessions[0] ?? null;

  const showTomorrow = isEvening();
  const tomorrow = addDaysLocal(today, 1);
  const tomorrowQuery = useSessionsForDate(tomorrow, showTomorrow);
  const tomorrowSessions = showTomorrow ? (tomorrowQuery.data ?? []) : [];

  const loading =
    programQuery.isLoading ||
    sessionsQuery.isLoading ||
    metricsQuery.isLoading;

  const showCachedOffline =
    !online && (programQuery.isFetched || sessionsQuery.isFetched);

  if (loading && !showCachedOffline) {
    return <TodaySkeleton />;
  }

  if (!program) {
    return (
      <EmptyState
        title="Start Week 1"
        description="No active program yet. Seed data or create your 12-week hybrid ascent to see today's session."
        action={
          <Button asChild variant="outline">
            <Link to="/train/program">View program structure</Link>
          </Button>
        }
      />
    );
  }

  const readiness = metricsQuery.data?.readiness;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {showCachedOffline ? (
        <p className="text-sm text-muted-foreground" role="status">Showing cached data while offline.</p>
      ) : null}

      {context?.isDeload ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Deload week — volume and intensity are scaled down. Focus on quality movement.
        </div>
      ) : null}

      <div>
        <h2 className="font-display text-2xl font-semibold">{greetingForHour()}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {context ? (
            <>
              <Chip>Week {context.weekNumber}</Chip>
              <Chip variant="outline">{context.mesoName}</Chip>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {readiness != null ? (
          <RingProgress value={readiness} label="Ready" />
        ) : (
          <EmptyState
            className="max-w-xs py-6"
            title="No readiness score"
            description="Check-in and nightly recompute populate readiness."
          />
        )}

        {primarySession ? (
          <SessionHero session={primarySession} />
        ) : (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>No session today</CardTitle>
              <p className="text-sm text-muted-foreground">
                Program starts {program.start_date}. Nothing scheduled for {today}.
              </p>
            </CardHeader>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {proteinQuery.data != null ? (
          <MetricCard label="Protein today" value={Math.round(proteinQuery.data)} unit="g" />
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">No meals logged today.</CardContent>
          </Card>
        )}
        {loadQuery.data != null ? (
          <MetricCard label="Weekly load" value={loadQuery.data.toFixed(1)} unit="au" />
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">Weekly load not computed yet.</CardContent>
          </Card>
        )}
        {streakQuery.data != null ? (
          <MetricCard label="Training streak" value={streakQuery.data} unit="days" />
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">No completed sessions yet.</CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-in</CardTitle>
          <p className="text-sm text-muted-foreground">Sleep, energy, soreness, and RHR.</p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>Log check-in</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coach tip</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Hit protein target early on training days. AI coach arrives in Phase 9.
        </CardContent>
      </Card>

      {showTomorrow && tomorrowSessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tomorrow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tomorrowSessions.map((s) => (
              <p key={s.id}>{s.date}: {s.title} ({s.type})</p>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
