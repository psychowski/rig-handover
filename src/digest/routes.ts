import { Hono } from 'hono';
import type { RigConfig } from '../config.js';
import { readNight } from './types.js';

export function digestApi(config: Pick<RigConfig, 'runsDir'>) {
  const app = new Hono();

  app.get('/api/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) {
      return c.notFound();
    }

    try {
      return c.json(readNight(config.runsDir, night));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return c.notFound();
      }
      throw error;
    }
  });

  return app;
}
