import { describe, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { renderA11y } from '@/test/render-a11y';

describe('SettingsPage', () => {
  it('passes axe', async () => {
    await renderA11y(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    );
  });
});
