import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'

import { db } from '../db/index.js'
import { redis } from '../lib/redis.js'

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  // TODO: wire Better Auth session resolution
  const session = null

  return {
    req,
    res,
    db,
    redis,
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
