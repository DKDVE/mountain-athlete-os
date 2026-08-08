import { TOTAL_WEEKS, isDeloadWeek, mesocycleForWeek } from '@maos/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useActiveProgram } from '@/features/program/program-queries';

export function ProgramHubPage() {
  const { data: program, isLoading, isError } = useActiveProgram();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <EmptyState
        title="No program"
        description="Load seed data or create a program to explore the 12-week structure."
      />
    );
  }

  const structure = program.structure;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="font-display text-2xl font-semibold">{program.name}</h2>
        <p className="text-sm text-muted-foreground">
          Starts {program.start_date} · {structure.macro.totalWeeks} weeks
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Macro</h3>
        <Card>
          <CardContent className="p-4">
            <p className="font-display text-lg font-semibold">{structure.macro.name}</p>
            <p className="text-sm text-muted-foreground">{TOTAL_WEEKS} weeks · 3 mesocycles</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Mesocycles</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {structure.mesocycles.map((meso) => (
            <Card key={meso.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{meso.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Weeks {meso.startWeek}–{meso.endWeek}
                </p>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{meso.focus}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Weeks</h3>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((week) => {
            const meso = mesocycleForWeek(week, structure);
            return (
              <Card key={week}>
                <CardContent className="flex items-center justify-between p-3">
                  <span className="font-display font-medium">Week {week}</span>
                  <div className="flex gap-1">
                    <Chip variant="outline">{meso.name}</Chip>
                    {isDeloadWeek(week) ? <Chip variant="warning">Deload</Chip> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Weekly template</h3>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {structure.weeklyTemplate.map((slot) => (
              <div key={slot.templateKey} className="flex justify-between px-4 py-3 text-sm">
                <span>{slot.title}</span>
                <span className="text-muted-foreground">{slot.type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
