# CurrencyPulse — Web

React SPA с PWA-поддержкой. Конвертер валют, графики курсов, управление алертами.

## Dev

```bash
pnpm --filter web dev       # http://localhost:5173
pnpm --filter web build     # Vite build → dist/
pnpm --filter web typecheck
pnpm --filter web lint
```

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build | Vite 6 |
| Routing | TanStack Router (file-based, auto code-splitting) |
| Server State | TanStack Query 5 + tRPC 11 client |
| Client State | MobX 6 + mobx-react-lite |
| Styling | Tailwind CSS 4 (via @tailwindcss/vite) |
| i18n | i18next 25 + react-i18next 15 (typed keys) |
| Charts | Recharts |
| PWA | vite-plugin-pwa (Workbox) |

## Организация кода

Код живёт рядом с тем, где используется. Выносим только при реальной необходимости.

### Где что лежит

| Что | Где |
|---|---|
| Код только для одной страницы | Рядом со страницей в `-folder/` |
| Компоненты/хуки/утилиты для нескольких страниц | `src/components/`, `src/hooks/`, `src/lib/` |
| Глобальный стейт (user, session) | `src/models/` |
| UI-примитивы (Button, Input) | `@currency-pulse/ui` |
| API-контракты (обе стороны) | `@currency-pulse/shared` |

### Colocation: страница + её код

TanStack Router игнорирует файлы и папки с префиксом `-`. Модели, компоненты и хуки страницы живут рядом с роутом:

```
src/routes/
├── __root.tsx
├── index.tsx
│
├── converter.tsx                   # /converter — роут
├── -converter/                     # - prefix → игнорируется роутером
│   ├── converter.model.ts          # MobX-модель
│   ├── currency-select.tsx         # Компонент только для этой страницы
│   ├── use-rate-history.ts         # Хук только для этой страницы
│   └── constants.ts                # Константы только для этой страницы
│
├── alerts/
│   ├── index.tsx                   # /alerts
│   ├── $alertId.tsx                # /alerts/:alertId
│   └── -components/                # Компоненты для секции alerts
│       ├── alert-card.tsx
│       └── alert-form.tsx
│
└── (auth)/                         # Route group (без URL-сегмента)
    └── login.tsx                   # /login
```

### Когда выносить

**В `src/components/`, `src/hooks/` и т.д.** — когда код используется на двух+ страницах:

```
# Было: компонент только для converter
src/routes/-converter/rate-chart.tsx

# Стало: нужен и на alerts → переезжает в shared-папку приложения
src/components/rate-chart.tsx
```

**В `@currency-pulse/ui`** — только UI-примитивы без бизнес-логики (Button, Input, Spinner).

**В `@currency-pulse/shared`** — только API-контракты, которые нужны и клиенту и серверу (Zod-схемы, типы, коды валют). Client-only код сюда не кладём.

**При появлении второго клиентского приложения** — shared hooks/утилиты из `src/` выносятся в отдельный пакет (например `@currency-pulse/core`).

## File Structure

```
src/
├── routes/                 # TanStack Router — file-based routing
│   ├── __root.tsx          # Root layout (header, outlet)
│   ├── index.tsx           # / — главная страница
│   └── routeTree.gen.ts    # Автогенерация (не редактировать)
│
├── models/                 # Глобальные MobX-модели (user, session, app state)
│
├── i18n/                   # Интернационализация
│   ├── index.ts            # i18next init (lng: 'ru')
│   ├── i18next.d.ts        # Типизация ключей
│   └── locales/
│       └── ru.ts           # Русские переводы
│
├── lib/                    # Глобальные утилиты
│   ├── trpc.ts             # tRPC client (httpBatchLink → /trpc)
│   ├── query-client.ts     # React Query client
│   └── utils.ts            # cn() (re-export из @currency-pulse/ui)
│
├── main.tsx                # Entry point
├── styles.css              # @import tailwind-config
└── vite-env.d.ts           # Vite + PWA type references
```

## Routing

Файловый роутинг через TanStack Router. Vite-плагин сканирует `src/routes/` и генерирует `routeTree.gen.ts`.

Конвенции:
- `__root.tsx` — root layout (обязательный)
- `index.tsx` — index route для директории
- `$param.tsx` — динамический сегмент
- `(group)/` — route group (только организация, не влияет на URL)
- `-folder/` — игнорируется роутером (для colocation моделей/компонентов)

## State Management

### MobX Model Pattern

```tsx
// -converter/converter.model.ts
export class ConverterModel {
  from = 'USD'
  to = 'EUR'
  amount = 1

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  swap() {
    [this.from, this.to] = [this.to, this.from]
  }
}

// converter.tsx
const [model] = useState(() => new ConverterModel())
```

## i18n

Один язык (русский), типизированные ключи. ESLint запрещает строковые children в JSX — все тексты через `t()`.

```tsx
import { useTranslation } from 'react-i18next'

function Page() {
  const { t } = useTranslation()
  return <h1>{t('home.title')}</h1>  // autocomplete работает
}
```

Добавление ключей:
1. Добавить в `src/i18n/locales/ru.ts`
2. TypeScript подхватит автоматически (через `i18next.d.ts`)

## tRPC

Клиент подключён к серверу через Vite dev proxy (`/trpc` → `localhost:3000`).

```tsx
import { trpc } from '@/lib/trpc'

const result = await trpc.currency.ping.query()
// result.message → 'pong' (типы от сервера)
```

## Styling

Tailwind CSS 4 (CSS-first, без `tailwind.config.ts`). Тема из `@currency-pulse/tailwind-config`.

```tsx
import { cn } from '@/lib/utils'

<div className={cn('p-4 rounded-lg', isActive && 'bg-accent')} />
```

## Lint

- **Import sorting** — `simple-import-sort` (auto-fixable)
- **Type imports** — `consistent-type-imports` (enforce `import type`)
- **JSX literals** — `react/jsx-no-literals` (запрещает строковые children, все тексты через i18n)
- **React hooks** — `rules-of-hooks` + `exhaustive-deps`

## PWA

Манифест и service worker настроены через `vite-plugin-pwa`. В production:
- Offline caching статики (Workbox)
- Install prompt
- App-like standalone display
