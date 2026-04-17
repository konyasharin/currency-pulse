import type { z } from 'zod'
import type {
  convertInputSchema,
  convertResultSchema,
  ratesSnapshotSchema,
} from '../schemas/currency'

export type RatesSnapshot = z.infer<typeof ratesSnapshotSchema>
export type ConvertInput = z.infer<typeof convertInputSchema>
export type ConvertResult = z.infer<typeof convertResultSchema>
