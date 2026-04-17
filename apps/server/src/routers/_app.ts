import { router } from '../trpc/trpc.js'
import { alertRouter } from './alert.js'
import { currencyRouter } from './currency.js'

export const appRouter = router({
  currency: currencyRouter,
  alert: alertRouter,
})

export type AppRouter = typeof appRouter
