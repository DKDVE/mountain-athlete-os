import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type HealthState =
  | { status: 'loading' }
  | { status: 'ok'; uptime: number }
  | { status: 'error'; message: string };

function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) return '';
  return url.replace(/\/$/, '');
}

async function fetchHealth(): Promise<HealthState> {
  const base = getApiBaseUrl();
  if (!base) {
    return { status: 'error', message: 'VITE_API_BASE_URL is not configured' };
  }

  try {
    const res = await fetch(`${base}/health`);
    if (!res.ok) {
      return { status: 'error', message: `API returned ${String(res.status)}` };
    }
    const body = (await res.json()) as { ok?: boolean; data?: { uptime?: number } };
    if (!body.ok || typeof body.data?.uptime !== 'number') {
      return { status: 'error', message: 'Unexpected health response shape' };
    }
    return { status: 'ok', uptime: body.data.uptime };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    if (message === 'Failed to fetch') {
      return {
        status: 'error',
        message:
          'Request blocked — often an ad blocker blocking onrender.com. Disable extensions for this site, or open the API health URL directly.',
      };
    }
    return { status: 'error', message };
  }
}

export function LandingPage() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' });

  const load = useCallback(async () => {
    setHealth({ status: 'loading' });
    setHealth(await fetchHealth());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 p-6">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Mountain Athlete OS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">MAOS — online</h1>
      </header>

      <section
        className="w-full rounded-lg border border-border bg-card p-6 text-card-foreground"
        aria-live="polite"
      >
        <h2 className="text-sm font-medium text-muted-foreground">API health</h2>
        {health.status === 'loading' && (
          <p className="mt-2 text-lg" role="status">Checking…</p>
        )}
        {health.status === 'ok' && (
          <p className="mt-2 text-lg font-medium text-foreground">
            ok <span className="text-muted-foreground">({health.uptime}s uptime)</span>
          </p>
        )}
        {health.status === 'error' && (
          <div className="mt-2 space-y-3">
            <p className="text-lg font-medium text-destructive">error</p>
            <p className="text-sm text-muted-foreground">{health.message}</p>
            {getApiBaseUrl() && (
              <p className="text-sm text-muted-foreground">
                API direct:{' '}
                <a
                  className="underline underline-offset-4 hover:text-foreground"
                  href={`${getApiBaseUrl()}/health`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {getApiBaseUrl()}/health
                </a>
              </p>
            )}
            <Button variant="outline" onClick={() => void load()} type="button">
              Retry
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
