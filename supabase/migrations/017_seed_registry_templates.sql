-- Seed registry with hand-crafted CLAUDE.md templates for popular stacks.
-- Uses a system author sentinel UUID so these are not tied to any real user.

do $$
declare
  v_author uuid := '00000000-0000-0000-0000-000000000001';
begin

insert into registry_items
  (id, author_id, type, name, description, content, stack, category, install_count, bucket, storage_path)
values

-- 1. Next.js (App Router)
(
  gen_random_uuid(), v_author, 'template',
  'Next.js 15 — App Router',
  'Production-ready CLAUDE.md for Next.js 15 projects using the App Router, TypeScript, and Tailwind CSS.',
  E'# CLAUDE.md\n\n## Stack\n- Next.js 15 (App Router)\n- TypeScript — strict mode\n- Tailwind CSS v4\n- Prisma + PostgreSQL (or Supabase)\n\n## Dev commands\n- `pnpm dev` — local server on :3000\n- `pnpm build` — production build\n- `pnpm lint` — ESLint\n- `pnpm test` — Jest + React Testing Library\n\n## Architecture\n- Server components by default; add `"use client"` only for interactivity\n- API routes live in `app/api/**`\n- Data fetching in server components via direct DB calls — no REST layer\n- Authentication handled by Clerk / NextAuth (check middleware.ts)\n\n## Conventions\n- Co-locate components with their route when single-use\n- Shared components in `components/`\n- Shared utilities in `lib/`\n- Environment variables prefixed `NEXT_PUBLIC_` are browser-safe\n\n## Never do\n- Skip TypeScript errors with `// @ts-ignore` without a comment explaining why\n- Use `any` type — use `unknown` and narrow\n- Commit `.env.local` or secrets\n- Run `npm install` — use `pnpm`',
  ARRAY['Next.js', 'TypeScript', 'Tailwind CSS', 'React'], 'Frontend', 120, 'chisel-registry', 'system/nextjs-app-router.md'
),

-- 2. FastAPI
(
  gen_random_uuid(), v_author, 'template',
  'FastAPI + Python',
  'CLAUDE.md for FastAPI services with Pydantic v2, SQLAlchemy 2, and pytest.',
  E'# CLAUDE.md\n\n## Stack\n- Python 3.12+\n- FastAPI 0.110+\n- Pydantic v2 for validation and settings\n- SQLAlchemy 2 (async) + Alembic migrations\n- pytest + httpx for testing\n\n## Dev commands\n- `uvicorn app.main:app --reload` — dev server on :8000\n- `alembic upgrade head` — run migrations\n- `pytest` — run test suite\n- `ruff check . && ruff format .` — lint + format\n\n## Project layout\n```\napp/\n  main.py        # FastAPI app instance\n  routers/       # Route modules (one file per domain)\n  models/        # SQLAlchemy ORM models\n  schemas/       # Pydantic request/response schemas\n  services/      # Business logic\n  db.py          # Async session factory\n```\n\n## Conventions\n- Async everywhere — use `async def` for route handlers and DB calls\n- Schemas are separate from ORM models — never return ORM objects directly\n- Settings via `pydantic-settings` from environment variables\n- Dependency injection for DB sessions: `Depends(get_db)`\n\n## Never do\n- Perform DB work in route handlers — delegate to services\n- Use `select *` in SQLAlchemy — always specify columns\n- Hardcode secrets — use `.env` + `pydantic-settings`',
  ARRAY['Python', 'FastAPI', 'PostgreSQL'], 'Backend', 98, 'chisel-registry', 'system/fastapi.md'
),

-- 3. Rails 7
(
  gen_random_uuid(), v_author, 'template',
  'Ruby on Rails 7',
  'CLAUDE.md for Rails 7 apps with Hotwire, PostgreSQL, and RSpec.',
  E'# CLAUDE.md\n\n## Stack\n- Ruby 3.3 / Rails 7.1\n- PostgreSQL\n- Hotwire (Turbo + Stimulus)\n- RSpec + FactoryBot + Capybara\n- Tailwind CSS (via cssbundling-rails)\n\n## Dev commands\n- `bin/dev` — starts Rails + Tailwind watcher (foreman)\n- `rails db:migrate` — run pending migrations\n- `rspec` — full test suite\n- `rubocop -A` — auto-correct lint issues\n- `rails c` — console\n\n## Conventions\n- Fat models, skinny controllers — business logic in models or service objects\n- Service objects in `app/services/` for multi-step operations\n- Turbo Frames for partial page updates; avoid full-page reloads\n- Avoid N+1 queries — always use `includes` or `preload`\n\n## Never do\n- Call external APIs directly in controllers — use background jobs\n- Add logic to views — use helpers or presenters\n- Skip `before_action :authenticate_user!` on protected routes',
  ARRAY['Ruby', 'Rails', 'PostgreSQL', 'Hotwire'], 'Backend', 74, 'chisel-registry', 'system/rails7.md'
),

-- 4. Go (Gin / stdlib)
(
  gen_random_uuid(), v_author, 'template',
  'Go — REST API',
  'CLAUDE.md for Go REST APIs using the standard library or Gin, with sqlx and pgx.',
  E'# CLAUDE.md\n\n## Stack\n- Go 1.22+\n- Gin (or net/http) for routing\n- sqlx + pgx/v5 for PostgreSQL\n- golang-migrate for migrations\n- testify for assertions\n\n## Dev commands\n- `go run ./cmd/server` — start server\n- `go test ./...` — run all tests\n- `go build -o bin/server ./cmd/server` — build binary\n- `golangci-lint run` — lint\n- `migrate -path db/migrations -database $DATABASE_URL up` — migrate\n\n## Project layout\n```\ncmd/server/        # main package\ninternal/\n  handler/         # HTTP handlers (thin)\n  service/         # business logic\n  repository/      # DB queries\n  model/           # domain types\ndb/migrations/     # SQL migration files\n```\n\n## Conventions\n- Dependency injection via constructor functions — no global state\n- Return errors explicitly — no panics in business logic\n- Use `context.Context` as first argument to all DB/service calls\n- Table-driven tests for handlers and services\n\n## Never do\n- Use `init()` for side effects\n- Ignore errors with `_`\n- Store mutable state in package-level variables',
  ARRAY['Go', 'PostgreSQL'], 'Backend', 61, 'chisel-registry', 'system/go-api.md'
),

-- 5. React (Vite)
(
  gen_random_uuid(), v_author, 'template',
  'React + Vite + TypeScript',
  'CLAUDE.md for single-page apps built with React 18, Vite, TypeScript, and TanStack Query.',
  E'# CLAUDE.md\n\n## Stack\n- React 18\n- Vite 5\n- TypeScript — strict mode\n- TanStack Query for server state\n- Zustand for client state\n- React Router v6\n- Tailwind CSS\n\n## Dev commands\n- `pnpm dev` — dev server on :5173\n- `pnpm build` — production build\n- `pnpm test` — Vitest\n- `pnpm lint` — ESLint\n\n## Conventions\n- Feature-based folder structure: `src/features/<name>/`\n- Co-locate hooks, components, and types per feature\n- Server state (API data) always in TanStack Query — never in useState\n- Global UI state in Zustand; local ephemeral state in useState\n- Avoid prop drilling beyond 2 levels — use context or Zustand\n\n## Never do\n- Fetch data in useEffect — use TanStack Query\n- Use `any` type\n- Mutate state directly',
  ARRAY['React', 'TypeScript', 'Vite', 'Tailwind CSS'], 'Frontend', 89, 'chisel-registry', 'system/react-vite.md'
),

-- 6. Django
(
  gen_random_uuid(), v_author, 'template',
  'Django 5 + DRF',
  'CLAUDE.md for Django 5 projects with Django REST Framework, Celery, and pytest-django.',
  E'# CLAUDE.md\n\n## Stack\n- Python 3.12 / Django 5\n- Django REST Framework\n- Celery + Redis for async tasks\n- PostgreSQL\n- pytest-django for testing\n- ruff for linting/formatting\n\n## Dev commands\n- `python manage.py runserver` — dev server\n- `python manage.py migrate` — run migrations\n- `python manage.py makemigrations` — create migrations\n- `celery -A config worker -l info` — start worker\n- `pytest` — run tests\n\n## Conventions\n- App-based structure: each domain is a Django app in `apps/`\n- Business logic in `services.py` — never in views or models\n- Serializers only for I/O validation — no business logic there\n- Background tasks for anything that touches external APIs\n- Use `select_related` and `prefetch_related` to avoid N+1\n\n## Never do\n- Put logic in views — use services\n- Use `Model.objects.all()` without filtering in list endpoints\n- Access `request.user` outside of views (pass user_id to services)',
  ARRAY['Python', 'Django', 'PostgreSQL', 'Celery'], 'Backend', 55, 'chisel-registry', 'system/django-drf.md'
),

-- 7. Supabase + Next.js
(
  gen_random_uuid(), v_author, 'template',
  'Supabase + Next.js',
  'CLAUDE.md for full-stack apps using Supabase for auth, database, and storage with Next.js.',
  E'# CLAUDE.md\n\n## Stack\n- Next.js 15 (App Router)\n- Supabase (Auth, PostgreSQL, Storage, Edge Functions)\n- TypeScript strict mode\n- Tailwind CSS\n\n## Dev commands\n- `pnpm dev` — Next.js dev server\n- `supabase start` — local Supabase stack\n- `supabase db push` — apply local migrations\n- `supabase gen types typescript --local > types/supabase.ts` — regenerate types\n\n## Supabase conventions\n- Server-side: use `createClient()` from `lib/supabase/server.ts` (service role for admin, anon for user-scoped)\n- Client-side: use `createBrowserClient()` from `lib/supabase/client.ts`\n- All tables have RLS enabled — never disable RLS\n- Migrations in `supabase/migrations/` — never edit the DB directly\n- Storage buckets: public for read-only assets, private for user content\n\n## Never do\n- Use the service role key client-side\n- Disable RLS on any table\n- Store user data outside of Supabase Auth user metadata or the `users` table',
  ARRAY['Next.js', 'Supabase', 'TypeScript', 'PostgreSQL'], 'Full-stack', 103, 'chisel-registry', 'system/supabase-nextjs.md'
),

-- 8. Express + Node
(
  gen_random_uuid(), v_author, 'template',
  'Express.js + TypeScript',
  'CLAUDE.md for Node.js REST APIs using Express, Zod validation, Prisma, and Jest.',
  E'# CLAUDE.md\n\n## Stack\n- Node.js 20 LTS / Express 4\n- TypeScript strict mode\n- Zod for runtime validation\n- Prisma ORM + PostgreSQL\n- Jest + Supertest for testing\n\n## Dev commands\n- `pnpm dev` — ts-node-dev with hot reload\n- `pnpm build` — tsc compile to `dist/`\n- `pnpm test` — Jest\n- `pnpm lint` — ESLint\n- `npx prisma migrate dev` — run migrations\n- `npx prisma studio` — DB GUI\n\n## Project layout\n```\nsrc/\n  routes/       # Express routers\n  controllers/  # Request/response handling\n  services/     # Business logic\n  middleware/   # Auth, error handling, validation\n  lib/          # DB client, helpers\n```\n\n## Conventions\n- Validate all request bodies with Zod before touching the DB\n- Central error handler in `middleware/errorHandler.ts`\n- Use async/await + express-async-errors — never `.catch()` in routes\n- Return consistent JSON: `{ data }` for success, `{ error, message }` for failures\n\n## Never do\n- Trust unvalidated user input\n- Handle errors inline in route handlers — throw and let the middleware catch',
  ARRAY['Node.js', 'Express', 'TypeScript', 'PostgreSQL'], 'Backend', 67, 'chisel-registry', 'system/express-ts.md'
),

-- 9. React Native (Expo)
(
  gen_random_uuid(), v_author, 'template',
  'React Native — Expo',
  'CLAUDE.md for cross-platform mobile apps built with Expo SDK 51, TypeScript, and NativeWind.',
  E'# CLAUDE.md\n\n## Stack\n- Expo SDK 51 (React Native)\n- TypeScript strict mode\n- NativeWind (Tailwind for React Native)\n- Expo Router (file-based navigation)\n- Zustand for state management\n- TanStack Query for server state\n\n## Dev commands\n- `npx expo start` — start dev server (scan QR with Expo Go)\n- `npx expo run:ios` — build and run on iOS simulator\n- `npx expo run:android` — build and run on Android emulator\n- `npx expo lint` — lint\n\n## Conventions\n- Expo Router file-based routes in `app/`\n- Native components (`View`, `Text`, `Pressable`) — never `div`/`button`\n- Use `StyleSheet.create` for performance-critical styles, NativeWind for general layout\n- Platform-specific code via `.ios.ts` / `.android.ts` file suffixes\n\n## Never do\n- Use web-only APIs without a polyfill\n- Mutate Zustand state directly — use setter functions\n- Skip `KeyboardAvoidingView` on forms',
  ARRAY['React Native', 'Expo', 'TypeScript'], 'Mobile', 44, 'chisel-registry', 'system/expo-react-native.md'
),

-- 10. Vue 3 + Nuxt
(
  gen_random_uuid(), v_author, 'template',
  'Nuxt 3 + Vue 3',
  'CLAUDE.md for full-stack Nuxt 3 applications with Pinia, VueUse, and Tailwind CSS.',
  E'# CLAUDE.md\n\n## Stack\n- Nuxt 3 (Vue 3 + Vite)\n- TypeScript\n- Pinia for state management\n- VueUse for composable utilities\n- Tailwind CSS\n- Nuxt Content for Markdown-driven pages\n\n## Dev commands\n- `pnpm dev` — dev server on :3000\n- `pnpm build` — production build\n- `pnpm generate` — static site generation\n- `pnpm lint` — ESLint\n\n## Conventions\n- Composables in `composables/` — prefix with `use`\n- Server API routes in `server/api/` — auto-imported by Nuxt\n- Auto-imported: components, composables, utils — no explicit imports needed\n- `useState` for SSR-safe shared state; Pinia for complex stores\n\n## Never do\n- Use `document`/`window` outside of `onMounted` or `<ClientOnly>`\n- Duplicate state between Pinia store and local component state\n- Return raw DB objects from `server/api/` — use DTOs',
  ARRAY['Vue', 'Nuxt', 'TypeScript', 'Tailwind CSS'], 'Full-stack', 38, 'chisel-registry', 'system/nuxt3.md'
),

-- 11. Rust (Axum)
(
  gen_random_uuid(), v_author, 'template',
  'Rust — Axum API',
  'CLAUDE.md for Rust web services built with Axum, SQLx, and Tokio.',
  E'# CLAUDE.md\n\n## Stack\n- Rust (stable)\n- Axum for HTTP routing\n- SQLx (async) + PostgreSQL\n- Tokio async runtime\n- serde + serde_json for serialization\n- anyhow / thiserror for error handling\n\n## Dev commands\n- `cargo run` — start server\n- `cargo test` — run tests\n- `cargo clippy -- -D warnings` — lint\n- `cargo fmt` — format\n- `sqlx migrate run` — apply migrations\n\n## Conventions\n- Use `AppState` wrapped in `Arc` for shared state — inject via Axum extension\n- Define a central `AppError` type that implements `IntoResponse`\n- Separate layers: handlers (thin) → services → repositories\n- Use `?` for error propagation — never `.unwrap()` in production paths\n- SQL queries via `sqlx::query_as!` macros (compile-time checked)\n\n## Never do\n- `.unwrap()` or `.expect()` in request handlers\n- Block the async runtime with synchronous I/O — use `tokio::task::spawn_blocking`\n- Skip the borrow checker — if it feels wrong, redesign the ownership',
  ARRAY['Rust', 'Axum', 'PostgreSQL'], 'Backend', 29, 'chisel-registry', 'system/rust-axum.md'
),

-- 12. Laravel
(
  gen_random_uuid(), v_author, 'template',
  'Laravel 11',
  'CLAUDE.md for Laravel 11 applications with Livewire, Pest, and MySQL/PostgreSQL.',
  E'# CLAUDE.md\n\n## Stack\n- PHP 8.3 / Laravel 11\n- Livewire 3 for reactive UI\n- Pest PHP for testing\n- MySQL or PostgreSQL\n- Laravel Horizon for queue monitoring\n\n## Dev commands\n- `php artisan serve` — dev server on :8000\n- `php artisan migrate` — run migrations\n- `php artisan migrate:fresh --seed` — reset and seed DB\n- `php artisan queue:work` — process jobs\n- `./vendor/bin/pest` — run tests\n\n## Conventions\n- Actions pattern: single-purpose classes in `app/Actions/`\n- Policies for authorization — never check permissions in Blade\n- Form Requests for validation — never validate in controllers\n- Eager load relationships to prevent N+1: `with([''relation''])`\n- Use Jobs for anything slow or external (emails, API calls)\n\n## Never do\n- Put business logic in controllers — use Actions or Services\n- Access `$_GET`/`$_POST` directly — use `$request`\n- Skip `authorize()` in controllers that touch user data',
  ARRAY['PHP', 'Laravel', 'MySQL'], 'Backend', 33, 'chisel-registry', 'system/laravel11.md'
)

on conflict do nothing;

end $$;
