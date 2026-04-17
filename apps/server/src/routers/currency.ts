import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { convert, getSnapshot } from '../services/converter.js'
import { publicProcedure, router } from '../trpc/trpc.js'

const ratesResponseSchema = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
})

const convertResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  amount: z.number(),
  result: z.number(),
  rate: z.number(),
})

const currencyCode = z
  .string()
  .length(3)
  .regex(/^[A-Za-z]{3}$/)
  .transform((v) => v.toUpperCase())

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
    .output(ratesResponseSchema)
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
    .input(
      z.object({
        from: currencyCode,
        to: currencyCode,
        amount: z.coerce.number().positive(),
      }),
    )
    .output(convertResponseSchema)
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
