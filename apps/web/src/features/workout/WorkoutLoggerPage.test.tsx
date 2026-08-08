import { describe, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderA11y } from '@/test/render-a11y';
import { WorkoutLoggerPage } from '@/features/workout/WorkoutLoggerPage';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function wrap(sessionId = 'sess-test') {
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
    await renderA11y(wrap('missing-session'));
  });
});
