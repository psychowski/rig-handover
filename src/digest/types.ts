import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type DigestStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  status: DigestStatus;
  error: string | null;
  firstAt: string | null;
  lastAt: string | null;
};

export type DigestNight = DigestRow[] & { malformedLines: number };

function isDigestStatus(value: unknown): value is DigestStatus {
  return value === 'ok' || value === 'retry' || value === 'fail';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readNight(runsDir: string, night: string): DigestNight {
  const rows = new Map<string, DigestRow>();
  let malformedLines = 0;

  const path = join(runsDir, `${night}.jsonl`);
  const content = readFileSync(path, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    let event: unknown;
    try {
      event = JSON.parse(line);
    } catch {
      malformedLines += 1;
      continue;
    }

    if (!isRecord(event)) {
      malformedLines += 1;
      continue;
    }

    const job = typeof event.job === 'string' ? event.job : null;
    const at = typeof event.at === 'string' ? event.at : null;
    const status = isDigestStatus(event.status) ? event.status : null;

    if (job === null || at === null || status === null) {
      malformedLines += 1;
      continue;
    }

    const owner = event.owner === null || typeof event.owner === 'string' ? event.owner : null;
    const error = typeof event.error === 'string' ? event.error : null;
    const existing = rows.get(job);

    if (existing) {
      existing.runs += 1;
      if (status === 'retry') {
        existing.retries += 1;
      }
      existing.owner = owner ?? existing.owner;
      existing.status = status;
      existing.error = error;
      existing.lastAt = at;
      if (existing.firstAt === null || Date.parse(at) < Date.parse(existing.firstAt)) {
        existing.firstAt = at;
      }
    } else {
      rows.set(job, {
        job,
        owner,
        runs: 1,
        retries: status === 'retry' ? 1 : 0,
        status,
        error,
        firstAt: at,
        lastAt: at,
      });
    }
  }

  const digestRows = Array.from(rows.values()).sort((left, right) => left.job.localeCompare(right.job));
  Object.assign(digestRows, { malformedLines });
  return digestRows as DigestNight;
}
