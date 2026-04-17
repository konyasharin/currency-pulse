import { db } from '../db/index.js'
import { rates } from '../db/schema.js'
import { redis } from '../lib/redis.js'

const EXCHANGE_API_URL = process.env.EXCHANGE_API_URL ?? 'https://open.er-api.com/v6'
const BASE = 'EUR'
const REDIS_KEY = 'rates:latest'
const REDIS_TTL_SECONDS = 3600

export interface RatesSnapshot {
  base: string
  date: string
  rates: Record<string, number>
}

interface ExchangeApiResponse {
  result: string
  base_code: string
  time_last_update_utc: string
  rates: Record<string, number>
}

export async function fetchAndStoreRates(): Promise<RatesSnapshot> {
  const response = await fetch(`${EXCHANGE_API_URL}/latest/${BASE}`)
  if (!response.ok) {
    throw new Error(`Exchange API error: ${response.status} ${response.statusText}`)
  }

  const raw = (await response.json()) as ExchangeApiResponse
  if (raw.result !== 'success') {
    throw new Error(`Exchange API non-success result: ${raw.result}`)
  }

  const { [raw.base_code]: _baseSelf, ...quoteRates } = raw.rates

  const snapshot: RatesSnapshot = {
    base: raw.base_code,
    date: new Date(raw.time_last_update_utc).toISOString().slice(0, 10),
    rates: quoteRates,
  }

  const rows = Object.entries(snapshot.rates).map(([quote, rate]) => ({
    base: snapshot.base,
    quote,
    rate: rate.toString(),
  }))

  if (rows.length > 0) {
    await db.insert(rates).values(rows)
  }

  await redis.set(REDIS_KEY, JSON.stringify(snapshot), 'EX', REDIS_TTL_SECONDS)

  return snapshot
}

export async function getCachedRates(): Promise<RatesSnapshot | null> {
  const cached = await redis.get(REDIS_KEY)
  return cached ? (JSON.parse(cached) as RatesSnapshot) : null
}
