import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'

import { startJobSchedulers } from './jobs/index.js'
import { appRouter } from './routers/_app.js'
import { createContext } from './trpc/context.js'

const server = Fastify({ logger: true })

async function main() {
  await server.register(cors, {
    origin: true,
    credentials: true,
  })

  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  })

  server.get('/health', async () => ({ status: 'ok' }))

  await startJobSchedulers()

  const port = Number(process.env.PORT) || 3000
  await server.listen({ port, host: '0.0.0.0' })

  console.log(`Server listening on port ${port}`)
}

main().catch((err) => {
  server.log.error(err)
  process.exit(1)
})
