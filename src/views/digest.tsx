import type { DigestRow } from '../digest/types.js';

export function DigestPage({
  night,
  rows,
  malformedLines,
}: {
  night: string;
  rows: DigestRow[];
  malformedLines: number;
}) {
  return (
    <>
      <h1>digest · {night}</h1>
      {malformedLines > 0 && <p class="mute">malformed lines: {malformedLines}</p>}
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>status</th>
              <th>error</th>
              <th>first time</th>
              <th>last time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr>
                <td>{row.job}</td>
                <td>{row.owner ?? '—'}</td>
                <td>{row.runs}</td>
                <td class={row.retries >= 3 ? 'warn' : undefined}>{row.retries}</td>
                <td class={row.status === 'fail' ? 'warn' : undefined}>{row.status}</td>
                <td>{row.error ?? '—'}</td>
                <td>{row.firstAt ?? '—'}</td>
                <td>{row.lastAt ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
