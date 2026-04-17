import { Queue, Worker } from 'bullmq'

import { redis } from '../lib/redis.js'
import { fetchAndStoreRates } from '../services/rate-fetcher.js'

const FETCH_RATES_QUEUE = 'fetch-rates'
const HOUR_MS = 60 * 60 * 1000

export async function startJobSchedulers() {
  const connection = redis

  const fetchRatesQueue = new Queue(FETCH_RATES_QUEUE, { connection })

  new Worker(
    FETCH_RATES_QUEUE,
    async () => {
      const snapshot = await fetchAndStoreRates()
      console.log(`[Jobs] fetch-rates ok, date=${snapshot.date}, pairs=${Object.keys(snapshot.rates).length}`)
    },
    { connection },
  )

  await fetchRatesQueue.upsertJobScheduler(
    'fetch-rates-scheduler',
    { every: HOUR_MS },
    { name: 'fetch-rates-tick' },
  )

  try {
    const snapshot = await fetchAndStoreRates()
    console.log(`[Jobs] initial fetch-rates ok, date=${snapshot.date}`)
  } catch (err) {
    console.error('[Jobs] initial fetch-rates failed:', err)
  }

  console.log('[Jobs] fetch-rates scheduler registered (hourly)')
}
