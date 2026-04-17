import { z } from 'zod'

export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Za-z]{3}$/)
  .transform((v) => v.toUpperCase())

export const ratesSnapshotSchema = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
})

export const convertInputSchema = z.object({
  from: currencyCodeSchema,
  to: currencyCodeSchema,
  amount: z.coerce.number().positive(),
})

export const convertResultSchema = z.object({
  from: z.string(),
  to: z.string(),
  amount: z.number(),
  result: z.number(),
  rate: z.number(),
})
