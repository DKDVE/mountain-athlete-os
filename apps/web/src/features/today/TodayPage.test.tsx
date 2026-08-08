import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, it } from 'vitest';
import { TodayPage } from '@/features/today/TodayPage';
import { renderA11y } from '@/test/render-a11y';

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('TodayPage', () => {
  it('passes axe with empty program state', async () => {
    await renderA11y(wrap(<TodayPage />));
  });
});
