import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('digest JSON route', () => {
  it('returns the night rows in job order', async () => {
    const config = {
      adapter: 'shim',
      installed: '2026-10-29T14:06:00+01:00',
      beatEverySeconds: 60,
      runsDir: 'runs',
    };

    const res = await createApp(config).request('/api/digest/2026-10-28');
    const rows = await res.json();

    expect(res.status).toBe(200);
    expect(rows.map((row: { job: string }) => row.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('returns 404 when the night file does not exist', async () => {
    const config = {
      adapter: 'shim',
      installed: '2026-10-29T14:06:00+01:00',
      beatEverySeconds: 60,
      runsDir: 'runs/not-a-runs-directory',
    };

    const res = await createApp(config).request('/api/digest/2026-10-28');

    expect(res.status).toBe(404);
  });
});
