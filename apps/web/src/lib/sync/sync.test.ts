import { describe, expect, it, vi, beforeEach } from 'vitest';
import { maosDb } from '@/lib/db';
import { enqueueInsert, refreshOutboxCount } from '@/lib/sync/outbox';
import { flushOutbox } from '@/lib/sync/flush';
import { useConnectivityStore } from '@/stores/connectivity-store';

describe('sync outbox', () => {
  beforeEach(async () => {
    await maosDb.outbox.clear();
    useConnectivityStore.setState({ outboxCount: 0, online: true });
  });

  it('queues insert and flushes oldest-first on reconnect', async () => {
    const inserts: Record<string, unknown>[] = [];
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn((row: Record<string, unknown>) => {
          inserts.push(row);
          return Promise.resolve({ error: null });
        }),
      })),
    };

    await enqueueInsert('set_logs', {
      session_id: 'sess-1',
      exercise_id: 'squat',
      set_no: 1,
      weight_kg: 100,
      reps: 8,
    });
    await enqueueInsert('set_logs', {
      session_id: 'sess-1',
      exercise_id: 'squat',
      set_no: 2,
      weight_kg: 100,
      reps: 8,
    });

    await refreshOutboxCount();
    expect(useConnectivityStore.getState().outboxCount).toBe(2);

    const result = await flushOutbox(mockSupabase as never, 'user-1');
    expect(result.failed).toBe(false);
    expect(result.flushed).toBe(2);
    expect(inserts).toHaveLength(2);
    expect(inserts[0]?.set_no).toBe(1);
    expect(useConnectivityStore.getState().outboxCount).toBe(0);
  });

  it('treats 23505 unique violation as success', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => Promise.resolve({ error: { code: '23505', message: 'duplicate' } })),
      })),
    };

    await enqueueInsert('set_logs', { session_id: 's', exercise_id: 'e', set_no: 1 });
    const result = await flushOutbox(mockSupabase as never, 'user-1');
    expect(result.failed).toBe(false);
    expect(useConnectivityStore.getState().outboxCount).toBe(0);
  });
});
