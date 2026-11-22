import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { getCookie, setCookie } from 'hono/cookie';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { birthdays } from '../../db/schema.js';

type Env = { Variables: { circleId: string } };
const app = new Hono<Env>();
const relationships = ['Friends', 'Family', 'Work', 'Other'];
const colors = ['peach', 'sage', 'lavender', 'butter', 'rose', 'sky'];
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

app.use('/api/*', async (c, next) => {
  c.header('Cache-Control', 'private, no-store');
  if (['POST', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const origin = c.req.header('Origin');
    const host = c.req.header('X-Forwarded-Host') || c.req.header('Host');
    if (!origin || new URL(origin).host !== host) {
      return c.json({ error: 'Please make changes from the Confetti app.' }, 403);
    }
    if (c.req.method !== 'DELETE' && !c.req.header('Content-Type')?.includes('application/json')) {
      return c.json({ error: 'Please send a valid birthday.' }, 415);
    }
  }
  let circle = getCookie(c, 'confetti_circle');
  if (!circle || !/^[a-f0-9]{64}$/.test(circle)) circle = randomBytes(32).toString('hex');
  setCookie(c, 'confetti_circle', circle, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:' || c.req.header('X-Forwarded-Proto') === 'https',
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  c.set('circleId', createHash('sha256').update(circle).digest('hex'));
  await next();
});

function parseBirthday(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Please enter a birthday.');
  const data = value as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const month = Number(data.month);
  const day = Number(data.day);
  const year = data.year === null || data.year === '' || data.year === undefined ? null : Number(data.year);
  if (!name || name.length > 80) throw new Error('Enter a name between 1 and 80 characters.');
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error('Choose a valid birthday.');
  }
  const date = new Date(Date.UTC(year ?? 2000, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error('That date does not exist. Please check the day and month.');
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() || date > new Date())) {
    throw new Error('Enter a birth year from 1900 through today, or leave it blank.');
  }
  if (!relationships.includes(String(data.relationship))) throw new Error('Choose a relationship.');
  if (![0, 1, 3, 7, 14].includes(Number(data.reminderDays))) throw new Error('Choose a reminder time.');
  if (typeof data.notes !== 'string' || data.notes.length > 1500) throw new Error('Keep notes under 1,500 characters.');
  return {
    name, month, day, year,
    relationship: String(data.relationship),
    favorite: data.favorite === true,
    notes: data.notes.trim(),
    reminderDays: Number(data.reminderDays),
    color: colors.includes(String(data.color)) ? String(data.color) : 'peach',
  };
}

app.get('/api/birthdays', async (c) => {
  const list = await db.select({
    id: birthdays.id, name: birthdays.name, month: birthdays.month, day: birthdays.day,
    year: birthdays.year, relationship: birthdays.relationship, favorite: birthdays.favorite,
    notes: birthdays.notes, reminderDays: birthdays.reminderDays, color: birthdays.color,
  }).from(birthdays).where(eq(birthdays.circleId, c.get('circleId'))).orderBy(birthdays.createdAt);
  return c.json({ birthdays: list });
});

app.post('/api/birthdays', async (c) => {
  let data;
  try { data = parseBirthday(await c.req.json()); }
  catch (error) { return c.json({ error: error instanceof Error ? error.message : 'Please check the birthday details.' }, 400); }
  const [birthday] = await db.insert(birthdays).values({ ...data, circleId: c.get('circleId') }).returning({ id: birthdays.id });
  return c.json({ birthday: { ...data, id: birthday.id } }, 201);
});

app.patch('/api/birthdays/:id', async (c) => {
  if (!uuid.test(c.req.param('id'))) return c.json({ error: 'Birthday not found.' }, 404);
  let data;
  try { data = parseBirthday(await c.req.json()); }
  catch (error) { return c.json({ error: error instanceof Error ? error.message : 'Please check the birthday details.' }, 400); }
  const [updated] = await db.update(birthdays).set(data).where(and(eq(birthdays.id, c.req.param('id')), eq(birthdays.circleId, c.get('circleId')))).returning({ id: birthdays.id });
  if (!updated) return c.json({ error: 'This birthday is no longer in your circle. Refresh and try again.' }, 404);
  return c.json({ birthday: { ...data, id: updated.id } });
});

app.delete('/api/birthdays/:id', async (c) => {
  if (!uuid.test(c.req.param('id'))) return c.json({ error: 'Birthday not found.' }, 404);
  const [deleted] = await db.delete(birthdays).where(and(eq(birthdays.id, c.req.param('id')), eq(birthdays.circleId, c.get('circleId')))).returning({ id: birthdays.id });
  if (!deleted) return c.json({ error: 'This birthday has already been removed.' }, 404);
  return c.json({ ok: true });
});

// Serve the built frontend on the same origin as the API.
app.use('*', serveStatic({ root: './dist' }));
app.get('*', serveStatic({ path: './dist/index.html' }));

app.notFound((c) => c.json({ error: 'This page could not be found.' }, 404));
app.onError((_error, c) => c.json({ error: 'Your circle could not be reached. Please try again in a moment.' }, 503));

export default app;
