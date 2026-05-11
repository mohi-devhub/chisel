# Chisel — Architecture Document

**Version:** 2.0  

---

## 1. System Overview

Chisel is a Next.js 16 (App Router) full-stack web application. The core features are:

1. **Repo Scanner** — fetches a GitHub repo's structure, sends it to OpenAI (gpt-4o-mini), and returns a generated `CLAUDE.md` + recommended skills
2. **Registry** — community hub for `CLAUDE.md` templates and `.skill` zips (expanded from the original marketplace)
3. **Skill Generator** — generates `.skill` zips from plain-English descriptions via OpenAI
4. **Team Workspace** — private shared config library for Team subscribers

```
User Browser
    │
    ▼
Next.js App (Vercel)
    ├── /app                  → Pages & UI
    ├── /app/api              → API Routes (Node.js runtime)
    │       ├── /scan             → Repo scanner
    │       ├── /generate         → Skill generation
    │       ├── /registry         → Registry CRUD
    │       ├── /workspace        → Team workspace
    │       ├── /dashboard        → User dashboard data
    │       ├── /payments         → Checkout + webhook
    │       └── /webhooks/clerk   → User creation webhook
    │
    ├── Clerk                 → Auth (session, JWT)
    ├── Supabase Client       → DB reads/writes
    └── Dodo Payments SDK     → Checkout session creation
         │
         ▼
    External Services
    ├── OpenAI API (gpt-4o-mini)  → Repo scanning + skill generation
    ├── GitHub API (unauthenticated) → Fetch public repo structure
    ├── Supabase PostgreSQL    → Users, skills, registry, teams
    ├── Supabase Storage       → Stored .skill zips + templates
    └── Dodo Payments          → Subscription processing
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| Language | TypeScript | 6.0.3 |
| Styling | Tailwind CSS | 4.x |
| Auth | Clerk (`@clerk/nextjs`) | 7.x |
| Database | Supabase (PostgreSQL) | `@supabase/supabase-js` 2.x |
| File Storage | Supabase Storage | (bundled) |
| AI | OpenAI API (`gpt-4o-mini`) | `openai` SDK |
| Zip Generation | JSZip (server-side) | 3.10.1 |
| Payments | Dodo Payments + Standard Webhooks | `dodopayments` 2.x |
| Deployment | Vercel | — |
| Package Manager | pnpm | 10.x |
| Runtime | Node.js | ≥ 22.2 |

**AI provider rationale:** OpenAI `gpt-4o-mini` is used instead of Anthropic Claude because:
- Cost: ~$0.005–0.008 per generation vs ~$0.18+ for Claude Sonnet
- $50 OpenAI credit covers ~6,000–10,000 operations before needing to top up
- Quality is sufficient for structured JSON output (CLAUDE.md generation, skill generation)
- Model is configurable via `OPENAI_MODEL` env var

---

## 3. Database Schema (Supabase PostgreSQL)

### 3.1 `users`
```sql
create table users (
  id                text primary key,            -- Clerk user ID (e.g. "user_...")
  email             text not null unique,
  tier              text not null default 'free', -- 'free' | 'solo' | 'team_owner' | 'team_member'
  gen_count         integer not null default 0,  -- lifetime generation count
  monthly_gen_count integer not null default 0,
  monthly_reset_at  timestamptz default now(),
  trial_ends_at     timestamptz,                 -- now()+14 days on signup
  org_id            uuid references organizations(id), -- null if no team
  created_at        timestamptz default now()
);
```

> **Tier values:** `free` (0 scans after trial), `solo` ($9/mo), `team_owner` (owns Team workspace), `team_member` (invited to a Team workspace).

### 3.2 `skills`
```sql
create table skills (
  id            uuid primary key default gen_random_uuid(),
  user_id       text references users(id),
  name          text not null,
  description   text not null,
  storage_path  text not null,
  structure     jsonb,                          -- {has_scripts, has_references, has_assets}
  created_at    timestamptz default now()
);
```

### 3.3 `registry_items`
Replaces and expands `marketplace_listings`. Holds both CLAUDE.md templates and skills.

```sql
create table registry_items (
  id             uuid primary key default gen_random_uuid(),
  author_id      text references users(id) not null,
  type           text not null,               -- 'template' | 'skill'
  name           text not null,
  description    text not null,
  tags           text[],
  category       text,
  stack          text[],                      -- detected/declared stack tags e.g. ['nextjs','typescript']
  storage_path   text not null,               -- path in chisel-registry bucket
  install_count  integer not null default 0,
  published_at   timestamptz default now(),
  -- for skills only
  skill_id       uuid references skills(id)
);
```

### 3.4 `organizations`
```sql
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    text references users(id) not null,
  created_at  timestamptz default now()
);
```

### 3.5 `org_members`
```sql
create table org_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references organizations(id) not null,
  user_id    text references users(id) not null,
  role       text not null default 'member',  -- 'owner' | 'member'
  joined_at  timestamptz default now(),
  unique(org_id, user_id)
);
```

### 3.6 `org_items`
Workspace-private registry items (team templates and skills).

```sql
create table org_items (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references organizations(id) not null,
  registry_item_id uuid references registry_items(id), -- null if private-only
  name            text not null,
  description     text not null,
  type            text not null,              -- 'template' | 'skill'
  storage_path    text not null,
  pinned          boolean not null default false,
  created_at      timestamptz default now()
);
```

### 3.7 `anonymous_sessions`
```sql
create table anonymous_sessions (
  id           uuid primary key default gen_random_uuid(),
  fingerprint  text not null unique,
  scan_count   integer not null default 0,    -- free: 1 scan allowed
  created_at   timestamptz default now(),
  last_seen_at timestamptz default now()
);
```

### 3.8 `payments`
```sql
create table payments (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  text references users(id),
  provider                 text not null default 'dodo',
  dodo_checkout_session_id text,
  dodo_payment_id          text,
  plan                     text not null,     -- 'solo_monthly' | 'team_monthly'
  status                   text not null default 'pending',
  created_at               timestamptz default now()
);
```

---

## 4. Storage Layout (Supabase Storage)

```
Bucket: chisel-skills (private)
  └── skills/{user_id}/{uuid}.skill       ← user-generated skill zips

Bucket: chisel-registry (public)
  └── templates/{item_id}.md              ← CLAUDE.md template files
  └── skills/{item_id}.skill              ← published skill zips

Bucket: chisel-workspace (private)
  └── orgs/{org_id}/{item_id}             ← team-private templates and skills
```

---

## 5. API Routes

### `POST /api/scan`
Core repo scanner endpoint.

**Request:**
```json
{
  "repo_url": "https://github.com/owner/repo",
  "branch": "main"
}
```

**Server logic:**
1. Validate URL is a GitHub repo
2. Check quota: anonymous gets 1 scan (fingerprint-gated), authenticated gets unlimited
3. Fetch from GitHub API:
   - File tree (top 3 levels): `GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1`
   - Key manifests: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`
   - `README.md`
   - Existing `CLAUDE.md` (if present)
4. Detect stack from manifest content
5. Build prompt with repo context + detected stack
6. Call OpenAI `gpt-4o-mini` with structured output
7. Validate `CLAUDE.md` output (has content, has structure)
8. Fetch registry items matching detected stack tags
9. Return:
```json
{
  "claude_md": "# CLAUDE.md content...",
  "detected_stack": ["nextjs", "typescript", "supabase"],
  "recommended_skills": [
    { "id": "uuid", "name": "...", "description": "..." }
  ]
}
```

---

### `POST /api/generate`
Skill generation endpoint (unchanged from v1, swap Anthropic → OpenAI).

**Request:** `{ "description", "complexity", "include" }`  
**Response:** JSON with `skill_md`, `zip_base64`, `filename`, `remaining`

---

### `GET /api/registry`
Fetch registry items with pagination + filters.

**Query params:** `?type=template|skill&stack=nextjs&category=&sort=recent|popular&page=`

---

### `GET /api/registry/:id/download`
Increment `install_count` and return signed download URL.

---

### `POST /api/registry/publish`
Publish a template or skill to the public registry. Requires active Solo or Team subscription.

**Request:**
```json
{
  "type": "template",
  "name": "Next.js + Supabase",
  "description": "...",
  "tags": ["nextjs", "supabase"],
  "category": "fullstack",
  "stack": ["nextjs", "typescript", "supabase"],
  "content": "# CLAUDE.md full content..."
}
```

---

### `GET /api/workspace`
Fetch authenticated user's team workspace items. Requires `org_id` on user record.

---

### `POST /api/workspace/items`
Add a template or skill to the team workspace (team owner or member).

---

### `POST /api/payments/create-checkout`
Supports plans: `solo_monthly`, `team_monthly`.

---

### `POST /api/payments/webhook`
Dodo Payments webhook. On `payment.succeeded`:
- `solo_monthly` → `users.tier = 'solo'`
- `team_monthly` → create `organizations` record + set `users.tier = 'team_owner'`

---

### `POST /api/webhooks/clerk`
Clerk `user.created` webhook. Creates `users` row with `tier = 'free'` and `trial_ends_at = now() + 14 days`. Uses `ignoreDuplicates: true` to be replay-safe.

---

## 6. OpenAI Integration

### Model
`gpt-4o-mini` (configurable via `OPENAI_MODEL` env var)

### Repo Scanner Prompt (system)
```
You are an expert at configuring Claude Code for software projects.

Given a repository's file structure, package manifests, and README, generate an optimized CLAUDE.md file.

CLAUDE.md must include:
1. A "What is this project?" section (1–2 sentences)
2. A "Tech Stack" section listing detected technologies
3. A "Commands" section with the most important dev commands (build, test, lint, dev server)
4. A "Architecture" section with the key directories and what they contain
5. A "Key Conventions" section with 3–5 rules specific to this codebase
6. A "What NOT to do" section with 2–3 common pitfalls for this stack

Keep it under 200 lines. Be specific — generic advice is useless.

Respond ONLY with the raw CLAUDE.md content as a string. No JSON wrapper, no preamble.
```

### Skill Generator Prompt
Identical to v1 system prompt (unchanged). Returns JSON with `name`, `skill_md`, `scripts`, `references`, `assets`.

### Retry Logic
2 attempts on failure or invalid output. On retry, prepend correction instruction to the user message.

---

## 7. GitHub API Integration

All repo scanning uses the GitHub REST API v3 (no SDK needed — plain `fetch`).

```typescript
// Fetch file tree
const tree = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
  { headers: { Accept: "application/vnd.github.v3+json" } }
)

// Fetch file content
const content = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  { headers: { Accept: "application/vnd.github.v3+json" } }
)
// Content is base64-encoded in the response
```

**Rate limits:** Unauthenticated: 60 req/hr. Authenticated (via GitHub OAuth token, v2): 5,000 req/hr.  
For v1: unauthenticated is sufficient — each scan uses 2–5 requests.

**Private repos:** Not supported in v1. Prompt user to download repo as zip and upload instead.

---

## 8. Frontend Page Structure

```
/                        → Landing page + repo scanner (hero)
/generate                → Skill generator
/registry                → Public registry (templates + skills)
/registry/[id]           → Item detail + download
/workspace               → Team workspace (auth-gated, team tier only)
/dashboard               → Auth-gated: history, published items, billing
/pricing                 → Plans + Dodo Payments checkout
/sign-in                 → Clerk sign-in
/sign-up                 → Clerk sign-up
```

---

## 9. Auth & Middleware

Protected routes (Clerk middleware):
- `/dashboard/*`
- `/workspace/*`
- `/api/generate`
- `/api/registry/publish`
- `/api/workspace/*`
- `/api/payments/create-checkout`

Public routes:
- `/` (scanner works for 1 free scan)
- `/registry/*`
- `/api/scan` (quota enforced inside route)
- `/api/registry` (read)
- `/api/registry/*/download`
- `/pricing`

---

## 10. RLS Policies Summary

| Table | anon | authenticated | service_role |
|---|---|---|---|
| `users` | blocked | blocked | full access |
| `skills` | blocked | blocked | full access |
| `registry_items` | SELECT | SELECT | full access |
| `organizations` | blocked | blocked | full access |
| `org_members` | blocked | blocked | full access |
| `org_items` | blocked | blocked | full access |
| `anonymous_sessions` | blocked | blocked | full access |
| `payments` | blocked | blocked | full access |

Storage:
- `chisel-skills`: service role only
- `chisel-registry`: public SELECT (anon + authenticated)
- `chisel-workspace`: service role only

---

## 11. Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini          # optional override

# Dodo Payments
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_SOLO_MONTHLY_PRODUCT_ID=
DODO_TEAM_MONTHLY_PRODUCT_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 12. V2 Architecture Notes

### CLI Tool
- `npx chisel scan` — calls `/api/scan` with local file tree (no GitHub fetch needed)
- `npx chisel install <id>` — calls `/api/registry/:id/download` and unzips to `.claude/skills/`
- Auth via API key generated in dashboard

### MCP Registry
- New `registry_items.type = 'mcp'` with JSON blob of server config
- New `mcp_configs` table for structured MCP server metadata

### Analytics
- New `events` table: `(user_id, org_id, event_type, metadata, created_at)`
- Background job aggregates into `analytics_daily`
- Dashboard page reads aggregated table

### Seat Expansion
- `organizations` gains `seat_limit` column
- Dodo Payments quantity-based subscription for seat adds
