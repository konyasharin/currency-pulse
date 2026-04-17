import { initTRPC } from '@trpc/server'
import type { OpenApiMeta } from 'trpc-to-openapi'

import type { Context } from './context.js'

const t = initTRPC.meta<OpenApiMeta>().context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
