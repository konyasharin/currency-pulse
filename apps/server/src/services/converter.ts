import type { ConvertInput, ConvertResult, RatesSnapshot } from '@currency-pulse/shared/types'
import { desc, eq } from 'drizzle-orm'

import { db } from '../db/index.js'
import { rates } from '../db/schema.js'
import { fetchAndStoreRates, getCachedRates } from './rate-fetcher.js'

async function getSnapshot(): Promise<RatesSnapshot> {
  const cached = await getCachedRates()
  if (cached) return cached

  const latest = await db
    .select({
      quote: rates.quote,
      rate: rates.rate,
      base: rates.base,
      fetchedAt: rates.fetchedAt,
    })
    .from(rates)
    .where(eq(rates.base, 'EUR'))
    .orderBy(desc(rates.fetchedAt))
    .limit(200)

  if (latest.length === 0) {
    return await fetchAndStoreRates()
  }

  const newestFetchedAt = latest[0].fetchedAt.getTime()
  const fresh = latest.filter((row) => row.fetchedAt.getTime() === newestFetchedAt)

  return {
    base: fresh[0].base,
    date: fresh[0].fetchedAt.toISOString().slice(0, 10),
    rates: Object.fromEntries(fresh.map((r) => [r.quote, Number(r.rate)])),
  }
}

export function getRate({
  snapshot,
  from,
  to,
}: {
  snapshot: RatesSnapshot
  from: string
  to: string
}): number {
  if (from === to) return 1

  const table: Record<string, number> = { ...snapshot.rates, [snapshot.base]: 1 }

  const fromRate = table[from]
  const toRate = table[to]

  if (fromRate === undefined) throw new Error(`Unknown currency: ${from}`)
  if (toRate === undefined) throw new Error(`Unknown currency: ${to}`)

  return toRate / fromRate
}

export async function convert(input: ConvertInput): Promise<ConvertResult> {
  const snapshot = await getSnapshot()
  const rate = getRate({ snapshot, from: input.from, to: input.to })

  return {
    from: input.from,
    to: input.to,
    amount: input.amount,
    result: input.amount * rate,
    rate,
  }
}

export { getSnapshot }
