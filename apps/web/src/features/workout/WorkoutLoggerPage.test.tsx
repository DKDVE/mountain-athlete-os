import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderA11y } from '@/test/render-a11y';
import { WorkoutLoggerPage } from '@/features/workout/WorkoutLoggerPage';
import { useSession } from '@/features/workout/session-queries';

vi.mock('@/features/workout/session-queries', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user?: { id: string } }) => unknown) =>
    selector({ user: { id: 'user-test' } }),
}));

vi.mock('@/stores/connectivity-store', () => ({
  useConnectivityStore: (selector: (state: { online: boolean }) => unknown) =>
    selector({ online: true }),
}));

vi.mock('@/lib/db', () => ({
  maosDb: {
    workoutState: {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

const mockedUseSession = vi.mocked(useSession);

const PLANNED_LOWER_A = {
  exercises: [
    {
      exerciseId: 'goblet-squat',
      sets: [{ setNo: 1, reps: 8, weightKg: null, rpe: 7, tempo: null, isWarmup: false, isDropset: false }],
    },
  ],
  mobility: [],
};

function wrap(sessionId = 'sess-test') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/train/log/${sessionId}`]}>
        <Routes>
          <Route path="/train/log/:sessionId" element={<WorkoutLoggerPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('WorkoutLoggerPage a11y', () => {
  it('passes axe when session missing (empty state)', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      isLoading: false,
    } as ReturnType<typeof useSession>);
    await renderA11y(wrap('missing-session'));
  });
});

describe('WorkoutLoggerPage hydration', () => {
  it('renders planned workout without infinite re-render loop', async () => {
    const setStateSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedUseSession.mockReturnValue({
      data: {
        id: 'sess-1',
        date: '2026-08-10',
        type: 'lower',
        title: 'Lower A',
        planned: PLANNED_LOWER_A,
        status: 'upcoming',
        program_id: 'prog-1',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useSession>);

    render(wrap('sess-1'));

    await waitFor(
      () => {
        expect(screen.getByTestId('workout-logger')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Goblet Squat' })).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
    const maxDepthErrors = setStateSpy.mock.calls.filter((call) =>
      String(call[0]).includes('Maximum update depth'),
    );
    expect(maxDepthErrors).toHaveLength(0);
    setStateSpy.mockRestore();
  });
});
