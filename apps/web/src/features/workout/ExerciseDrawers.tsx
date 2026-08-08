import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { exerciseName, exerciseSeed } from '@/features/workout/exercise-meta';
import { useExerciseHistory } from '@/features/workout/exercise-history';

const PAIN_REGIONS = [
  { id: 'knee', label: 'Knee' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'lowBack', label: 'Low back' },
  { id: 'hip', label: 'Hip' },
  { id: 'ankle', label: 'Ankle' },
] as const;

export function PainSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (pain: { region: string; severity: number }) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => {
      if (!v) onClose();
    }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Log pain</DrawerTitle>
          <p className="text-sm text-muted-foreground">Region and severity (0–10).</p>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-8">
          <div className="grid gap-2 sm:grid-cols-2">
            {PAIN_REGIONS.map((r) => (
              <Button
                key={r.id}
                type="button"
                variant="outline"
                className="h-11 justify-start"
                data-testid={`pain-region-${r.id}`}
                onClick={() => {
                  onConfirm({ region: r.id, severity: 5 });
                  onClose();
                }}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function ExerciseDetailDrawer({
  exerciseId,
  open,
  onClose,
}: {
  exerciseId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const seed = exerciseId ? exerciseSeed(exerciseId) : null;
  const historyQuery = useExerciseHistory(exerciseId);

  return (
    <Drawer open={open} onOpenChange={(v) => {
      if (!v) onClose();
    }}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{exerciseId ? exerciseName(exerciseId) : 'Exercise'}</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-6 overflow-y-auto px-4 pb-8">
          {seed ? (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Cues</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {seed.cues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">History</h3>
            {historyQuery.isLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading history…</p>
            ) : historyQuery.data && historyQuery.data.length > 0 ? (
              <div className="mt-3 flex items-end gap-1 h-24" aria-label="Top set weight history">
                {historyQuery.data.map((pt) => {
                  const max = Math.max(...historyQuery.data.map((p) => p.topWeightKg), 1);
                  const h = Math.max(8, Math.round((pt.topWeightKg / max) * 100));
                  return (
                    <div key={pt.date} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary/80"
                        style={{ height: `${String(h)}%` }}
                        title={`${pt.date}: ${String(pt.topWeightKg)} kg × ${String(pt.topReps)}`}
                      />
                      <span className="text-[10px] text-muted-foreground">{pt.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                className="py-4"
                title="No history"
                description="Log working sets to build your exercise chart."
              />
            )}
          </section>

          {seed && seed.substitutions.length > 0 ? (
            <section>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Substitutions
              </h3>
              <ul className="mt-2 space-y-2 text-sm">
                {seed.substitutions.map((sub) => (
                  <li key={sub.id}>
                    <span className="font-medium">{exerciseName(sub.id)}</span>
                    <span className="text-muted-foreground"> — {sub.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <EmptyState className="py-4" title="No substitutions" description="No swaps listed for this lift." />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
