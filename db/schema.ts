import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const birthdays = pgTable('birthdays', {
  id: uuid('id').primaryKey().defaultRandom(),
  circleId: text('circle_id').notNull(),
  name: text('name').notNull(),
  month: integer('month').notNull(),
  day: integer('day').notNull(),
  year: integer('year'),
  relationship: text('relationship').notNull().default('Friends'),
  favorite: boolean('favorite').notNull().default(false),
  notes: text('notes').notNull().default(''),
  reminderDays: integer('reminder_days').notNull().default(1),
  color: text('color').notNull().default('peach'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('birthdays_circle_idx').on(table.circleId)]);
