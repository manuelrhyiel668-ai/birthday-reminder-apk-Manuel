import { serve } from '@hono/node-server';
import app from '../netlify/server/index.js';
import { ensureDatabase } from '../db/index.js';

const port = Number(process.env.PORT) || 3000;

try {
  await ensureDatabase();
  const server = serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
    console.log(`Confetti listening on port ${info.port}`);
  });

  process.on('SIGTERM', () => server.close());
  process.on('SIGINT', () => server.close());
} catch (error) {
  console.error('Confetti could not start. Check DATABASE_URL and Neon database access.', error);
  process.exit(1);
}
