import 'dotenv/config'

import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import { fastifyTRPCOpenApiPlugin } from 'trpc-to-openapi'

import { startJobSchedulers } from './jobs/index.js'
import { openApiDocument } from './lib/openapi.js'
import { appRouter } from './routers/_app.js'
import { createContext } from './trpc/context.js'

const swaggerUiHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CurrencyPulse API — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body { margin: 0 }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.addEventListener('load', () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: false,
        docExpansion: 'list',
      })
    })
  </script>
</body>
</html>`

const server = Fastify({ logger: true })

async function main() {
  await server.register(cors, {
    origin: true,
    credentials: true,
  })

  server.get('/openapi.json', () => openApiDocument)

  server.get('/docs', (_req, reply) => {
    reply.type('text/html').send(swaggerUiHtml)
  })

  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  })

  await server.register(fastifyTRPCOpenApiPlugin, {
    router: appRouter,
    createContext,
    basePath: '/api',
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
