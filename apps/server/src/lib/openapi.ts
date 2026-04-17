import { generateOpenApiDocument } from 'trpc-to-openapi'

import { appRouter } from '../routers/_app.js'

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'CurrencyPulse API',
  description: 'REST facade over tRPC — currency rates and conversion',
  version: '1.0.0',
  baseUrl: process.env.BETTER_AUTH_URL
    ? `${process.env.BETTER_AUTH_URL}/api`
    : 'http://localhost:3000/api',
  tags: ['Currency'],
})
