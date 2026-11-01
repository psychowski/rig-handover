import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/types.js';

describe('night log reader', () => {
  it('reads rows and counts malformed lines', () => {
    const rows = readNight('runs', '2026-10-28');

    expect(rows.malformedLines).toBe(1);
    expect(rows).toHaveLength(5);
    expect(rows.map((row) => row.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);

    expect(rows.find((row) => row.job === 'digest/render')?.owner).toBeNull();
    expect(rows.find((row) => row.job === 'fixtures/refresh')?.retries).toBe(3);
    expect(rows.find((row) => row.job === 'notes/backup')?.status).toBe('fail');
    expect(rows.find((row) => row.job === 'notes/backup')?.error).toBe('quota exceeded');
    expect(rows.find((row) => row.job === 'lane/sync')?.runs).toBe(8);
  });

  it('throws when a night file is missing', () => {
    expect(() => readNight('runs', 'missing-night')).toThrow();
  });
});
