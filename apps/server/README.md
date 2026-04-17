# CurrencyPulse — Server

Fastify API с tRPC, PostgreSQL, Redis и BullMQ job queue.

## Dev

```bash
pnpm --filter server dev        # tsx watch, hot-reload
pnpm --filter server build      # tsc → dist/
pnpm --filter server typecheck
pnpm --filter server lint
```

Database:
```bash
pnpm db:generate    # Генерация миграций из schema.ts
pnpm db:migrate     # Применение миграций
pnpm db:studio      # Drizzle Studio UI
```

## Stack

| Layer | Technology |
|---|---|
| HTTP | Fastify 5 |
| RPC | tRPC 11 (Fastify adapter) |
| Database | PostgreSQL 17 + Drizzle ORM |
| Cache | Redis 7 (ioredis) |
| Jobs | BullMQ 5 (persistent workers) |
| Auth | Better Auth |
| Push | web-push (VAPID) |
| Validation | Zod (shared schemas) |

## File Structure

```
src/
├── index.ts                # Entry — Fastify, CORS, tRPC mount, jobs start
│
├── routers/                # tRPC routers
│   ├── _app.ts             # Root router (AppRouter type export)
│   ├── currency.ts         # Курсы, конвертация
│   └── alert.ts            # CRUD алертов
│
├── trpc/                   # tRPC infrastructure
│   ├── trpc.ts             # initTRPC, router, publicProcedure
│   └── context.ts          # Per-request context (db, redis, session)
│
├── db/                     # Database
│   ├── index.ts            # Drizzle client (postgres.js driver)
│   └── schema.ts           # Drizzle table definitions
│
├── lib/                    # Shared utilities
│   └── redis.ts            # ioredis singleton
│
├── services/               # Business logic
│   ├── rate-fetcher.ts     # Fetch rates from external API → Redis cache
│   └── push-sender.ts      # web-push VAPID notifications
│
└── jobs/                   # BullMQ background workers
    └── index.ts            # Queue definitions, job schedulers
```

## Architecture

### Request Flow

```
Client Request
  → Fastify (CORS, logging)
    → tRPC adapter (/trpc prefix)
      → Context creation (db, redis, session)
        → Router → Procedure → Handler
          → Drizzle ORM / Redis / External API
            → Response
```

### tRPC Setup

```
routers/_app.ts          Root router (merges sub-routers)
  ├── currency            Public procedures (rates, convert)
  └── alert               Protected procedures (CRUD)

trpc/trpc.ts             Procedure definitions
  ├── publicProcedure      No auth required
  └── protectedProcedure   Requires session (TODO: Better Auth)

trpc/context.ts          Per-request context
  ├── db                   Drizzle instance
  ├── redis                ioredis instance
  ├── session              Auth session (null until wired)
  ├── req                  Fastify request
  └── res                  Fastify reply
```

`AppRouter` type экспортируется из `_app.ts` — web-клиент импортирует его type-only для end-to-end типобезопасности.

### Database (Drizzle)

```ts
// src/db/schema.ts — определение таблиц
export const users = pgTable('users', { ... })
export const alerts = pgTable('alerts', { ... })

// src/db/index.ts — клиент
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client)
```

Миграции: `drizzle-kit generate` → SQL файлы в `./drizzle/`, `drizzle-kit migrate` → применить.

### Background Jobs (BullMQ)

Persistent workers (требуется long-running процесс, не serverless):

| Job | Schedule | Action |
|---|---|---|
| `fetch-rates` | Каждый час | frankfurter.dev → Redis cache |
| `check-alerts` | Каждые 5 мин | Redis rates vs DB alerts → web-push |

```ts
await queue.upsertJobScheduler('fetch-rates-scheduler', {
  every: 3600000,  // 1 hour
})
```

### Push Notifications

```
User creates alert → DB
  ↓
check-alerts worker (BullMQ, every 5 min)
  ↓
Rate crosses threshold → web-push.sendNotification()
  ↓
Service Worker → showNotification()
```

VAPID keys генерируются через `npx web-push generate-vapid-keys`.

## Environment

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `BETTER_AUTH_SECRET` | Yes | Session secret (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | Server public URL |
| `VAPID_PUBLIC_KEY` | For push | Web Push public key |
| `VAPID_PRIVATE_KEY` | For push | Web Push private key |
| `VAPID_SUBJECT` | For push | mailto: contact |
| `PORT` | No | Server port (default 3000) |

## Docker

```bash
# Dev (только БД)
docker compose up -d postgres redis

# Production (всё)
docker compose up -d
```

Dockerfile: multi-stage build (Node 22 Alpine), copies shared package source для runtime resolution.
