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
  runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-page-'));
});

afterEach(() => {
  rmSync(runsDir, { recursive: true, force: true });
});

describe('digest page', () => {
  it('renders sorted rows and marks repeated retries and failures', async () => {
    const events = [
      { at: '2026-10-28T00:00:00+01:00', job: 'zeta', status: 'ok', owner: 'rook' },
      { at: '2026-10-28T01:00:00+01:00', job: 'alpha', status: 'retry', owner: 'rook' },
      { at: '2026-10-28T01:01:00+01:00', job: 'alpha', status: 'retry', owner: 'rook' },
      { at: '2026-10-28T01:02:00+01:00', job: 'alpha', status: 'retry', owner: 'rook' },
      { at: '2026-10-28T01:03:00+01:00', job: 'alpha', status: 'ok', owner: 'rook' },
      { at: '2026-10-28T02:00:00+01:00', job: 'failed', status: 'fail', owner: null, error: 'quota exceeded' },
    ];
    writeFileSync(join(runsDir, '2026-10-28.jsonl'), events.map((event) => JSON.stringify(event)).join('\n'));

    const response = await createApp(config()).request('/digest/2026-10-28');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html.indexOf('alpha')).toBeLessThan(html.indexOf('failed'));
    expect(html.indexOf('failed')).toBeLessThan(html.indexOf('zeta'));
    expect(html).toContain('<td class="warn">3</td>');
    expect(html).toContain('<td class="warn">fail</td>');
    expect(html).toContain('quota exceeded');
    expect(html).toContain('—');
  });

  it('returns 404 when the night file is missing', async () => {
    const response = await createApp(config()).request('/digest/2026-10-28');

    expect(response.status).toBe(404);
  });

  it('renders an empty-state message for an empty night file', async () => {
    writeFileSync(join(runsDir, '2026-10-28.jsonl'), '');

    const response = await createApp(config()).request('/digest/2026-10-28');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('nothing ran');
  });

  it('reports malformed lines in the night file', async () => {
    writeFileSync(join(runsDir, '2026-10-28.jsonl'), '{bad json\n');

    const response = await createApp(config()).request('/digest/2026-10-28');
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('malformed lines: 1');
    expect(html).toContain('nothing ran');
  });
});
