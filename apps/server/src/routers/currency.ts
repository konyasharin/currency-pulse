import { publicProcedure, router } from '../trpc/trpc.js'

export const currencyRouter = router({
  ping: publicProcedure.query(() => {
    return { message: 'pong' }
  }),
})
