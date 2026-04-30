# Chisel — Architecture Document

**Version:** 1.0 (MVP)  

---

## 1. System Overview

Chisel is a Next.js 16 (App Router) full-stack web application backed by Supabase (Postgres + Storage), authenticated via Clerk, and monetized via Razorpay. Skill generation is handled server-side via the Anthropic Claude API. Generated zip files are assembled server-side using JSZip and returned as a binary download.

```
User Browser
    │
    ▼
Next.js App (Vercel)
    ├── /app              → Pages & UI
    ├── /app/api          → API Routes (Edge/Node)
    │       ├── /generate     → Core skill generation
    │       ├── /publish      → Marketplace publish
    │       └── /webhook      → Razorpay payment webhook
    │
    ├── Clerk             → Auth (session, JWT)
    ├── Supabase Client   → DB reads (skills, users, marketplace)
    └── Razorpay SDK      → Payment order creation
         │
         ▼
    External Services
    ├── Anthropic Claude API   → Skill content generation
    ├── Supabase Postgres      → Users, skills, marketplace, usage
    ├── Supabase Storage       → Stored .skill zip files
    └── Razorpay               → Payment processing
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| Language | TypeScript | 6.0.3 |
| Styling | Tailwind CSS | 4.2.4 |
| Auth | Clerk (`@clerk/nextjs`) | 7.2.5 |
| Database | Supabase (PostgreSQL) | `@supabase/supabase-js` 2.104.1 |
| File Storage | Supabase Storage | (bundled with supabase-js) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) | `@anthropic-ai/sdk` 0.90.0 |
| Zip Generation | JSZip (server-side) | 3.10.1 |
| Payments | Razorpay | 2.9.6 |
| Deployment | Vercel | — |
| Package Manager | pnpm | 10.33.2 |
| Runtime | Node.js | ≥ 22.2 (required by razorpay) |

> **JSZip note:** JSZip 3.10.1 is stable but no longer actively developed. It is safe for _creating_ zips (our use case) — the security concern only applies when _parsing_ untrusted zip archives, which Chisel does not do.

---

## 3. Database Schema (Supabase PostgreSQL)

### 3.1 `users`
```sql
create table users (
  id                  uuid primary key,           -- matches Clerk user ID
  email               text not null unique,
  tier                text not null default 'free', -- 'free' | 'creator' | 'pro'
  gen_count           integer not null default 0,  -- lifetime generation count (display/analytics)
  monthly_gen_count   integer not null default 0,  -- resets each billing cycle
  monthly_reset_at    timestamptz default now(),   -- when monthly_gen_count was last reset
  credits             integer not null default 0,  -- one-time credit pack balance
  trial_ends_at       timestamptz,                 -- set to now()+7 days on signup; null if no trial
  created_at          timestamptz default now()
);
```

### 3.2 `skills`
```sql
create table skills (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id),   -- null for anonymous
  name          text not null,
  description   text not null,
  storage_path  text not null,               -- path in Supabase Storage
  structure     jsonb,                       -- {has_scripts, has_references, has_assets}
  created_at    timestamptz default now()
);
```

### 3.3 `marketplace_listings`
```sql
create table marketplace_listings (
  id              uuid primary key default gen_random_uuid(),
  skill_id        uuid references skills(id),
  author_id       uuid references users(id),
  name            text not null,
  description     text not null,
  tags            text[],
  category        text,
  download_count  integer default 0,
  storage_path    text not null,             -- public-accessible path
  published_at    timestamptz default now()
);
```

### 3.4 `anonymous_sessions`
```sql
create table anonymous_sessions (
  id            uuid primary key default gen_random_uuid(),
  fingerprint   text not null,              -- IP + user-agent hash
  gen_count     integer not null default 0,
  created_at    timestamptz default now(),
  last_seen_at  timestamptz default now()
);
```

### 3.5 `payments`
```sql
create table payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id),
  razorpay_order_id   text not null,
  razorpay_payment_id text,
  plan            text not null,
    -- 'creator_monthly' | 'pro_monthly' | 'pro_annual' | 'credit_pack'
  status          text not null default 'pending', -- 'pending' | 'paid' | 'failed'
  created_at      timestamptz default now()
);
```

---

## 4. API Routes

### `POST /api/generate`
Core skill generation endpoint.

**Request:**
```json
{
  "description": "A skill that helps Claude write database migrations",
  "complexity": "standard",
  "include": {
    "scripts": true,
    "references": true,
    "assets": false
  }
}
```

**Server logic:**
1. Identify caller: Clerk session (authenticated) or fingerprint (anonymous)
2. Check generation quota:
   - Anonymous / free: lifetime `gen_count < 3`
   - Creator (or active trial): if `now() > monthly_reset_at` reset `monthly_gen_count`; check `monthly_gen_count < 30`; if over cap, check `credits > 0` and deduct 1 credit, else 403
   - Pro: same as creator but cap is 100/month
   - Overage: deduct from `users.credits`; if credits = 0 return 402 with upgrade prompt
3. Check `include.*` flags: if `scripts/references/assets` requested and user is free tier → return 403 with upgrade prompt
4. Build prompt and call Claude API
5. Parse response into file tree
6. Validate SKILL.md YAML frontmatter (name + description required)
7. Package into zip via JSZip
8. Upload zip to Supabase Storage (`skills/{user_id or anon_id}/{uuid}.skill`)
9. Insert record into `skills` table
10. Increment `gen_count`
11. Return zip as binary download (`Content-Type: application/zip`)

**Response:** Binary `.skill` zip file + `Content-Disposition: attachment`

---

### `POST /api/publish`
Publish a skill to the marketplace. Requires authenticated pro user.

**Request:**
```json
{
  "skill_id": "uuid",
  "name": "DB Migration Helper",
  "description": "...",
  "tags": ["database", "migrations"],
  "category": "backend"
}
```

**Server logic:**
1. Verify Clerk session → user must exist and `tier = 'pro'`
2. Verify `skill_id` belongs to this user
3. Copy skill from private storage path to public storage bucket
4. Insert into `marketplace_listings`
5. Return listing ID

---

### `POST /api/payments/create-order`
Creates a Razorpay order.

**Request:** `{ "plan": "creator_monthly" | "pro_monthly" | "pro_annual" | "credit_pack" }`

**Amounts:**
- `creator_monthly` → ₹399
- `pro_monthly` → ₹899
- `pro_annual` → ₹7,499
- `credit_pack` → ₹199 (grants 20 credits on capture)

**Logic:**
1. Verify Clerk session
2. Calculate amount based on plan
3. Create Razorpay order
4. Insert pending record into `payments` table
5. Return `{ order_id, amount, currency, key_id }`

---

### `POST /api/payments/webhook`
Razorpay webhook handler for payment confirmation.

**Logic:**
1. Verify Razorpay webhook signature
2. On `payment.captured` event:
   - Update `payments` record → `status = 'paid'`
   - If plan is `creator_monthly` → `users.tier = 'creator'`
   - If plan is `pro_monthly` or `pro_annual` → `users.tier = 'pro'`
   - If plan is `credit_pack` → `users.credits += 20`
3. Return 200

---

### `GET /api/marketplace`
Fetch marketplace listings with pagination + filters.

**Query params:** `?category=&tags=&sort=newest|downloads&page=&limit=`

---

### `GET /api/marketplace/:id/download`
Increment download count and return a signed Supabase Storage URL for the skill zip.

---

## 5. Claude API — Prompt Design

The generation prompt is the core IP of Chisel. It runs server-side only and is never exposed to the client.

### System Prompt (condensed)
```
You are an expert at writing Claude Code skills. A skill is a structured folder containing:
- SKILL.md: YAML frontmatter (name, description) + markdown instructions
- scripts/: executable Python or shell scripts for deterministic tasks
- references/: markdown documentation loaded into context as needed
- assets/: static files (templates, fonts, icons)

Rules:
1. SKILL.md must have valid YAML frontmatter with `name` and `description` fields.
2. `description` must explain WHEN to trigger the skill — be specific, be slightly pushy.
3. SKILL.md should be under 500 lines. Use references/ for overflow.
4. Scripts handle deterministic, repetitive, or computational tasks.
5. References hold deep domain knowledge, API docs, or schemas.

Respond ONLY with a JSON object in this exact shape:
{
  "skill_md": "full SKILL.md content as string",
  "scripts": [{ "filename": "...", "content": "..." }],
  "references": [{ "filename": "...", "content": "..." }],
  "assets": []
}
No preamble, no markdown fences.
```

### User Prompt
```
Generate a Claude Code skill for the following:

Description: {user_description}
Complexity: {simple | standard | full}
Include scripts: {true | false}
Include references: {true | false}
Include assets: {true | false}
```

---

## 6. Zip Packaging (Server-side)

```typescript
import JSZip from 'jszip'

async function packageSkill(generated: GeneratedSkill): Promise<Buffer> {
  const zip = new JSZip()
  const root = zip.folder(generated.name)!

  root.file('SKILL.md', generated.skill_md)

  if (generated.scripts.length > 0) {
    const scripts = root.folder('scripts')!
    for (const s of generated.scripts) {
      scripts.file(s.filename, s.content)
    }
  }

  if (generated.references.length > 0) {
    const refs = root.folder('references')!
    for (const r of generated.references) {
      refs.file(r.filename, r.content)
    }
  }

  return zip.generateAsync({ type: 'nodebuffer' })
}
```

---

## 7. Anonymous Session Fingerprinting

For anonymous users, generation quota is enforced via:
- SHA-256 hash of: `IP address + User-Agent`
- Stored in `anonymous_sessions` table
- On sign-up: if anonymous `fingerprint` matches, carry over `gen_count` to user account (counts toward the 3-lifetime free limit)

This is a soft gate — not cryptographically secure, but sufficient for casual abuse prevention.

---

## 8. Frontend Page Structure

```
/                        → Landing page + generator
/marketplace             → Public skill catalog
/marketplace/[id]        → Skill detail + download
/dashboard               → Auth-gated: history, published skills (pro)
/pricing                 → Plans + Razorpay checkout
/sign-in                 → Clerk sign-in
/sign-up                 → Clerk sign-up
```

---

## 9. Storage Layout (Supabase Storage)

```
Bucket: chisel-skills (private)
  └── skills/
        ├── {user_id}/{skill_uuid}.skill    ← authenticated user skills
        └── anon/{session_id}/{uuid}.skill  ← anonymous skills

Bucket: chisel-marketplace (public)
  └── listings/
        └── {listing_id}.skill             ← published marketplace skills
```

---

## 10. Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 11. V2 Architecture Notes (Premium Marketplace)

When building the premium skill layer, the following additions are needed:

- `marketplace_listings` gains: `is_premium boolean`, `price integer`, `author_payout_account text`
- New table: `skill_purchases (id, buyer_id, listing_id, payment_id, purchased_at)`
- Razorpay Route (or manual payout): split captured payment 70/30 at webhook time
- Creator dashboard page: earnings, download stats, payout history
- Download gate: `/api/marketplace/:id/download` checks `skill_purchases` for premium listings before issuing signed URL
