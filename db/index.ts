import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Add your Neon connection string to the hosting environment.');
}

const client = neon(databaseUrl);
export const db = drizzle(client, { schema });

/** Create the app table on first boot; safe to run again on every deployment. */
export async function ensureDatabase() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS birthdays (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      circle_id text NOT NULL,
      name text NOT NULL,
      month integer NOT NULL,
      day integer NOT NULL,
      year integer,
      relationship text NOT NULL DEFAULT 'Friends',
      favorite boolean NOT NULL DEFAULT false,
      notes text NOT NULL DEFAULT '',
      reminder_days integer NOT NULL DEFAULT 1,
      color text NOT NULL DEFAULT 'peach',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS birthdays_circle_idx ON birthdays (circle_id)`);
}
