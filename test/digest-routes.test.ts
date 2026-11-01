import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

let runsDir: string;

const config = () => ({
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir,
});

beforeEach(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-api-'));
});

afterEach(() => {
  rmSync(runsDir, { recursive: true, force: true });
});

describe('digest JSON route', () => {
  it('returns the night rows in job order', async () => {
    const events = [
      { at: '2026-10-28T01:00:00+01:00', job: 'zeta', status: 'ok', owner: 'rook' },
      { at: '2026-10-28T00:00:00+01:00', job: 'alpha', status: 'retry', owner: 'rook' },
    ];
    writeFileSync(join(runsDir, '2026-10-28.jsonl'), events.map((event) => JSON.stringify(event)).join('\n'));

    const res = await createApp(config()).request('/api/digest/2026-10-28');
    const rows = await res.json();

    expect(res.status).toBe(200);
    expect(rows.map((row: { job: string }) => row.job)).toEqual([
      'alpha',
      'zeta',
    ]);
  });

  it('returns 404 when the night file does not exist', async () => {
    const res = await createApp(config()).request('/api/digest/2026-10-28');

    expect(res.status).toBe(404);
  });

  it('returns an empty array for an empty night file', async () => {
    writeFileSync(join(runsDir, '2026-10-28.jsonl'), '');

    const res = await createApp(config()).request('/api/digest/2026-10-28');
    const rows = await res.json();

    expect(res.status).toBe(200);
    expect(rows).toEqual([]);
  });

  it('skips malformed lines and returns valid rows', async () => {
    writeFileSync(
      join(runsDir, '2026-10-28.jsonl'),
      [
        '{bad json',
        JSON.stringify({ at: '2026-10-28T00:00:00+01:00', job: 'alpha', status: 'ok', owner: 'rook' }),
      ].join('\n'),
    );

    const res = await createApp(config()).request('/api/digest/2026-10-28');
    const rows = await res.json();

    expect(res.status).toBe(200);
    expect(rows.map((row: { job: string }) => row.job)).toEqual(['alpha']);
  });
});
