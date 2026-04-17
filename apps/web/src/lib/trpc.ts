import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from 'server/src/routers/_app'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/trpc',
    }),
  ],
})
