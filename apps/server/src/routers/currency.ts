import {
  convertInputSchema,
  convertResultSchema,
  ratesSnapshotSchema,
} from '@currency-pulse/shared/schemas'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { convert, getSnapshot } from '../services/converter.js'
import { publicProcedure, router } from '../trpc/trpc.js'

export const currencyRouter = router({
  getRates: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/rates',
        tags: ['Currency'],
        summary: 'Get latest currency rates (base EUR)',
      },
    })
    .input(z.void())
    .output(ratesSnapshotSchema)
    .query(async () => {
      return await getSnapshot()
    }),

  convert: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/convert',
        tags: ['Currency'],
        summary: 'Convert amount from one currency to another',
      },
    })
    .input(convertInputSchema)
    .output(convertResultSchema)
    .query(async ({ input }) => {
      try {
        return await convert(input)
      } catch (err) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err instanceof Error ? err.message : 'Conversion failed',
        })
      }
    }),
})
