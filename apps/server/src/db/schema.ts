import { index, numeric, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

export const rates = pgTable(
  'rates',
  {
    id: serial('id').primaryKey(),
    base: varchar('base', { length: 3 }).notNull(),
    quote: varchar('quote', { length: 3 }).notNull(),
    rate: numeric('rate', { precision: 18, scale: 8 }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('rates_pair_idx').on(t.base, t.quote, t.fetchedAt.desc())],
)
