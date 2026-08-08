import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RingProgress } from '@/components/ui/ring-progress';

const MILESTONES = new Set([30, 10, 0]);

export function RestTimer({
  endsAt,
  initialDurationS = 90,
  onSkip,
  onAdjust,
}: {
  endsAt: number;
  initialDurationS?: number;
  onSkip: () => void;
  onAdjust: (deltaS: number) => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)),
  );
  const [collapsed, setCollapsed] = useState(false);
  const liveRef = useRef<HTMLSpanElement>(null);
  const announced = useRef<Set<number>>(new Set());

  useEffect(() => {
    const tick = () => {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => {
      clearInterval(id);
    };
  }, [endsAt]);

  useEffect(() => {
    if (!MILESTONES.has(remaining) || announced.current.has(remaining)) return;
    announced.current.add(remaining);
    const msg =
      remaining === 0 ? 'Rest complete' : `${String(remaining)} seconds remaining`;
    if (liveRef.current) liveRef.current.textContent = msg;
    if (remaining === 0 && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(120);
    }
  }, [remaining]);

  useEffect(() => {
    const onScroll = () => {
      setCollapsed(window.scrollY > 120);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const shellClass = collapsed
    ? 'fixed bottom-20 right-4 z-40 rounded-full border bg-card px-4 py-2 shadow-lg md:bottom-6'
    : 'fixed bottom-20 left-4 right-4 z-40 rounded-xl border bg-card p-4 shadow-lg md:bottom-6 md:left-auto md:right-6 md:w-80';

  return (
    <div className={shellClass} role="status" aria-live="polite" data-testid="rest-timer">
      <span ref={liveRef} className="sr-only" />
      {collapsed ? (
        <p className="font-mono text-sm tabular-nums">{remaining}s rest</p>
      ) : (
        <div className="flex items-center gap-4">
          <RingProgress value={remaining} max={initialDurationS} size={160} label="s" className="shrink-0" />
          <div className="flex-1">
            <p className="font-mono text-3xl tabular-nums">{remaining}s</p>
            <p className="text-sm text-muted-foreground">Rest</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                aria-label="Subtract 15 seconds"
                onClick={() => {
                  onAdjust(-15);
                }}
              >
                −15s
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label="Add 15 seconds"
                onClick={() => {
                  onAdjust(15);
                }}
              >
                +15s
              </Button>
              <Button size="sm" variant="outline" onClick={onSkip}>Skip</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
