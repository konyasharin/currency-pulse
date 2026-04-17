# CurrencyPulse

PWA-конвертер валют с пуш-уведомлениями о курсах.

## Quick Start

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

Web: `http://localhost:5173` | API: `http://localhost:3000` | Health: `GET /health`

## Monorepo Structure

```
currency-pulse/
├── apps/
│   ├── web/                    # React SPA (Vite + PWA)
│   └── server/                 # REST/tRPC API (Fastify)
│
├── packages/
│   ├── shared/                 # API-контракты: Zod-схемы, типы, константы (client + server)
│   ├── ui/                     # UI-примитивы (Button, Input, ...) + cn()
│   ├── tailwind-config/        # Shared Tailwind v4 тема
│   ├── eslint-config/          # ESLint flat config (base + react)
│   └── typescript-config/      # Shared tsconfig (base, web, server)
│
├── docker-compose.yml          # Postgres + Redis + server
├── turbo.json                  # Task pipeline
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | React 19, Vite 6, TanStack Router (file-based), Tailwind CSS 4 |
| State | MobX + mobx-react-lite, TanStack Query |
| API Client | tRPC 11 (httpBatchLink) |
| i18n | i18next + react-i18next (typed keys) |
| Backend | Fastify 5, tRPC 11 (Fastify adapter) |
| Database | PostgreSQL 17 + Drizzle ORM |
| Cache / Queues | Redis 7 + BullMQ |
| Auth | Better Auth |
| Push | web-push (VAPID) + Service Worker |
| PWA | vite-plugin-pwa (Workbox) |
| Charts | Recharts |

## Architecture

```
┌─────────────┐     tRPC (HTTP batch)     ┌──────────────┐
│   React     │ ◄────────────────────────► │   Fastify    │
│   (Vite)    │       /trpc proxy          │   + tRPC     │
│             │                            │              │
│  TanStack   │                            │  Drizzle ORM │──► PostgreSQL
│  Router     │                            │  ioredis     │──► Redis
│  Query      │                            │  BullMQ      │──► Job Queue
│  MobX       │                            │  web-push    │──► Push Notifications
│  i18next    │                            │  Better Auth │
└─────────────┘                            └──────────────┘
```

### Data Flow

- **Server state**: React Query кеширует tRPC-запросы (staleTime 60s)
- **Client state**: MobX-модели для UI-логики
- **Routing**: TanStack Router, file-based (`src/routes/`), auto code-splitting
- **i18n**: `i18next` с типизированными ключами (`t('home.title')` → autocomplete)
- **Lint**: строковые children в JSX запрещены — все тексты через `t()`

### Code Organization

Код живёт рядом с тем, где используется. Выносим только при реальной необходимости.

**Packages — строгие границы:**

| Пакет | Что в нём | Кто импортирует |
|---|---|---|
| `@currency-pulse/shared` | API-контракты: Zod-схемы, типы запросов/ответов, коды валют | client + server |
| `@currency-pulse/ui` | UI-примитивы (Button, Input, Spinner) + `cn()` | только client |

В `shared` **запрещён** client-only код (хуки, React-компоненты). В `ui` **запрещена** бизнес-логика.

**Внутри `apps/web/` — colocation:**

| Что | Где |
|---|---|
| Код только для одной страницы | Рядом со страницей в `-folder/` |
| Компоненты/хуки/утилиты для нескольких страниц | `src/components/`, `src/hooks/`, `src/lib/` |
| Глобальный стейт (user, session) | `src/models/` |

**При появлении второго клиентского приложения** — shared hooks/утилиты выносятся в отдельный пакет (например `@currency-pulse/core`).

**Пример:**
```
apps/web/src/
├── routes/
│   ├── converter.tsx               # Роут /converter
│   ├── -converter/                 # Только для этой страницы
│   │   ├── converter.model.ts
│   │   ├── currency-select.tsx
│   │   └── use-rate-history.ts
│   └── alerts/
│       ├── index.tsx
│       └── -components/
│           └── alert-card.tsx
├── components/                     # Shared across pages
│   └── rate-chart.tsx
├── hooks/                          # Shared hooks
└── models/                         # Global state
```

### tRPC Type Flow

```
server/src/routers/_app.ts      →  export type AppRouter
     ↓ (type-only import via tsconfig path alias)
web/src/lib/trpc.ts             →  createTRPCClient<AppRouter>
```

Типы текут от сервера к клиенту без кодогенерации. Web tsconfig имеет path alias `"server/*": ["../server/*"]`, импорт чисто типовой — zero runtime.

### Background Jobs

BullMQ workers (persistent server, не serverless):
- **fetch-rates** — cron, раз в час забирает курсы с frankfurter.dev → Redis
- **check-alerts** — cron, каждые 5 минут проверяет алерты → web-push

## Packages

| Package | Purpose | Exports |
|---|---|---|
| `@currency-pulse/shared` | API-контракты: Zod-схемы, типы, константы (client + server) | `.`, `./schemas`, `./constants` |
| `@currency-pulse/ui` | UI-примитивы (Button, Input, Spinner) + `cn()` | `.`, `./lib` |
| `@currency-pulse/tailwind-config` | Tailwind v4 тема (CSS) | `.`, `./theme` |
| `@currency-pulse/eslint-config` | ESLint 9 flat config | `.`, `./react` |
| `@currency-pulse/typescript-config` | Shared tsconfig | `base.json`, `web.json`, `server.json` |

Shared packages используют source protocol — exports указывают на `.ts` файлы напрямую, без build step.

## Scripts

```bash
pnpm dev              # Start all (web :5173, server :3000)
pnpm build            # Build all
pnpm typecheck        # TypeScript check
pnpm lint             # ESLint (import sort, type imports, react-hooks)
pnpm db:generate      # Drizzle — generate migrations
pnpm db:migrate       # Drizzle — run migrations
pnpm db:studio        # Drizzle — open Studio UI
```

## Environment Variables

See `.env.example` for full list. Key variables:

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | server | PostgreSQL connection |
| `REDIS_URL` | server | Redis connection |
| `BETTER_AUTH_SECRET` | server | Session encryption |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | server | Web Push keys |
| `VITE_API_URL` | web | API base URL |
| `VITE_VAPID_PUBLIC_KEY` | web | Push subscription |

## Deploy

**Target**: Railway ($5/мес) или VPS с Docker Compose.

Архитектура требует persistent server (BullMQ workers, cron), поэтому Vercel serverless не подходит.

```bash
# VPS
docker compose up -d

# Railway
# Подключить PostgreSQL + Redis add-ons, задеплоить server + web
```
