import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function RestTimer({
  endsAt,
  onSkip,
}: {
  endsAt: number;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => {
      clearInterval(id);
    };
  }, [endsAt]);

  useEffect(() => {
    if (remaining === 30 || remaining === 10 || remaining === 0) {
      // ponytail: aria-live region for countdown milestones
    }
  }, [remaining]);

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-40 rounded-xl border bg-card p-4 shadow-lg md:bottom-6 md:left-auto md:right-6 md:w-72"
      role="status"
      aria-live="polite"
    >
      <p className="font-mono text-3xl tabular-nums">{remaining}s</p>
      <p className="text-sm text-muted-foreground">Rest</p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="outline" onClick={onSkip}>Skip</Button>
      </div>
    </div>
  );
}
