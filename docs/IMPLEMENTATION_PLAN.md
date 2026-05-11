# Chisel — Implementation Plan

Ordered build sequence. Each phase is independently shippable and builds on the last.

**Current state entering this plan:**
- Auth (Clerk), database (Supabase), skill generation, marketplace, dashboard, and payments are all built and working.
- The pivot is: (1) repo scanner replaces skill generation as the hero feature, (2) marketplace expands to a full registry supporting CLAUDE.md templates, (3) team workspace is added, (4) OpenAI replaces Anthropic.

---

## Phase 0 — Foundation Changes

**Goal:** Swap AI provider, update pricing plans, migrate database schema for new product.

### AI Provider Swap
- [ ] Install OpenAI SDK: `pnpm add openai`
- [ ] Remove `@anthropic-ai/sdk` dependency
- [ ] Rewrite `lib/anthropic.ts` → `lib/openai.ts`:
  - Keep same interface: `generateSkill(request) → GeneratedSkill`
  - Use `openai.chat.completions.create` with `gpt-4o-mini`
  - Keep retry logic (2 attempts), same prompt, same JSON parsing
- [ ] Update all imports from `@/lib/anthropic` → `@/lib/openai`
- [ ] Rename `ANTHROPIC_API_KEY` → `OPENAI_API_KEY` in `.env.local` and `.env.local.example`
- [ ] Add `OPENAI_MODEL=gpt-4o-mini` to env

### Database Schema Migration
- [ ] Apply migration `010_registry_items`:
  - Create `registry_items` table (replaces `marketplace_listings`)
  - Keep `marketplace_listings` as alias/view for backward compat during transition, or migrate data
- [ ] Apply migration `011_organizations`:
  - Create `organizations` table
  - Create `org_members` table
  - Create `org_items` table
  - Add `org_id` column to `users`
- [ ] Apply migration `012_anonymous_scan_quota`:
  - Add `scan_count` column to `anonymous_sessions`
- [ ] Apply migration `013_update_tiers`:
  - Update `users.tier` check constraint to include `'solo'` | `'team_owner'` | `'team_member'`
- [ ] Apply migration `014_rls_registry`:
  - Enable RLS on new tables
  - Add SELECT policy on `registry_items` for anon + authenticated

### Storage
- [ ] Create `chisel-registry` bucket (public, 10MB limit, `['application/zip','text/plain','text/markdown']`)
- [ ] Create `chisel-workspace` bucket (private, 10MB limit)
- [ ] Add public SELECT policy on `chisel-registry` storage objects

### Pricing Update
- [ ] Update `lib/dodo-payments.ts`: replace `creator_monthly` / `pro_monthly` / `pro_annual` / `credit_pack` with `solo_monthly` / `team_monthly`
- [ ] Update `app/pricing/page.tsx`: new two-plan layout (Solo $9/mo, Team $49/mo) + 14-day trial CTA
- [ ] Update `app/api/payments/webhook/route.ts`: map `solo_monthly` → `tier = 'solo'`, `team_monthly` → create org + `tier = 'team_owner'`
- [ ] Update trial duration: 7 days → 14 days in `lib/users.ts` and `app/api/webhooks/clerk/route.ts`

**Test:** Generate a skill using OpenAI. Verify response format unchanged. Verify pricing page shows correct plans.

---

## Phase 1 — Repo Scanner

**Goal:** Hero feature. User scans a GitHub repo and gets a generated `CLAUDE.md` + skill recommendations.

### GitHub Integration
- [ ] `lib/github.ts`:
  - `fetchRepoTree(owner, repo, branch?)` — calls GitHub trees API, returns filtered file list
  - `fetchFileContent(owner, repo, path)` — base64 decodes file content
  - `detectStack(manifests)` — infers stack tags from `package.json`, `pyproject.toml`, `go.mod`, etc.
  - `buildRepoContext(owner, repo)` — orchestrates: fetch tree + key manifests + README + existing CLAUDE.md → returns `RepoContext`
  - `parseGitHubUrl(url)` — validates and extracts `{ owner, repo, branch }` from a GitHub URL

### OpenAI Scanner Prompt
- [ ] `lib/scanner.ts`:
  - `buildScanPrompt(context: RepoContext)` — builds user message with file tree, manifest contents, detected stack
  - `scanRepo(context: RepoContext)` → `{ claude_md: string, detected_stack: string[] }` — calls OpenAI with scan system prompt, validates output, retries once on failure

### API Route
- [ ] `app/api/scan/route.ts`:
  1. Parse + validate GitHub URL from request body
  2. Get fingerprint; check anonymous scan quota (max 1 scan for unauthenticated)
  3. If authenticated: call `ensureUserRecord`, verify trial/subscription active
  4. Call `buildRepoContext` → `scanRepo`
  5. Fetch up to 5 registry items matching detected stack tags
  6. Return `{ claude_md, detected_stack, recommended_skills }`
  7. Store scan in `anonymous_sessions.scan_count` or user record (analytics)

### Frontend
- [ ] Redesign `app/page.tsx` as the scanner landing:
  - Hero: "Configure Claude Code for any project in 60 seconds"
  - Input: GitHub URL field + "Scan" button
  - Result: split pane — generated `CLAUDE.md` on right (editable `<textarea>`), recommended skills below
  - Copy to clipboard + Download buttons
  - Unauthenticated: show result for first scan, then sign-up gate
- [ ] Loading state: skeleton / streaming feel while scanning
- [ ] Error states: private repo, invalid URL, rate limit hit

**Test:** Scan `https://github.com/vercel/next.js`. Verify generated CLAUDE.md is specific to Next.js. Scan a Django repo. Scan a Go repo. Verify stack detection works.

---

## Phase 2 — Registry

**Goal:** Replace/expand marketplace into a full registry supporting both CLAUDE.md templates and skills.

### Backend
- [ ] `lib/registry.ts`:
  - `getRegistryItems({ type, stack, category, sort, page })` — queries `registry_items`
  - `getRegistryItem(id)` — single item with author info
  - `publishRegistryItem({ authorId, type, name, description, tags, stack, content })` — uploads content to `chisel-registry` storage, inserts into `registry_items`
  - `incrementInstallCount(id)` — atomic increment
- [ ] `app/api/registry/route.ts` — paginated list with filters
- [ ] `app/api/registry/[id]/route.ts` — single item fetch + preview content
- [ ] `app/api/registry/[id]/download/route.ts` — increment count + signed URL
- [ ] `app/api/registry/publish/route.ts` — publish template or skill (requires active subscription)

### Frontend
- [ ] `app/registry/page.tsx`:
  - Two tabs: **Templates** and **Skills**
  - Stack filter chips (Next.js, Django, Go, Rails, etc.) + text search + sort
  - Grid of item cards
- [ ] `app/registry/[id]/page.tsx`:
  - Item detail: name, description, stack badges, install count, author
  - For templates: rendered CLAUDE.md preview
  - For skills: terminal-style SKILL.md preview (reuse existing `PreviewPane`)
  - Download / Copy button
- [ ] `components/registry/RegistryCard.tsx` — unified card for templates + skills
- [ ] `components/registry/PublishDialog.tsx` — publish form (type selector, metadata, content upload/paste)

### Migrate existing marketplace listings
- [ ] Data migration: copy `marketplace_listings` rows into `registry_items` with `type = 'skill'`
- [ ] Redirect `/marketplace` → `/registry` (Next.js permanent redirect in `next.config.ts`)

**Test:** Publish a template. Browse registry filtered by "nextjs". Download a skill. Verify install count increments.

---

## Phase 3 — Team Workspace

**Goal:** Team subscribers get a private shared config library.

### Backend
- [ ] `lib/workspace.ts`:
  - `getOrg(userId)` — fetch org for user
  - `getOrgItems(orgId)` — fetch workspace items
  - `addOrgItem({ orgId, type, name, description, content })` — upload + insert
  - `removeOrgItem(orgId, itemId)` — delete
  - `inviteMember(orgId, email)` — create pending invite (v1: lookup by email in users table)
  - `removeMember(orgId, userId)`
- [ ] `app/api/workspace/route.ts` — GET workspace items
- [ ] `app/api/workspace/items/route.ts` — POST add item, DELETE remove item
- [ ] `app/api/workspace/members/route.ts` — GET members, POST invite, DELETE remove
- [ ] Org creation in payment webhook: on `team_monthly` capture → `insert into organizations` + set user `tier = 'team_owner'` + insert into `org_members`

### Frontend
- [ ] `app/workspace/page.tsx`:
  - Members list (owner can invite/remove)
  - Templates tab + Skills tab (team-private items)
  - Add item: upload or generate inline
  - Pinned items shown first
- [ ] Workspace item cards with pin/unpin + remove actions
- [ ] Team invite UI: email input → sends invite (v1: direct lookup; v2: email invite flow)
- [ ] Dashboard integration: show workspace summary card for team users

**Test:** Upgrade to Team. Create org. Invite second user. Verify workspace items are shared. Remove member, verify access revoked.

---

## Phase 4 — Polish & Launch

**Goal:** Production-ready UX and infrastructure.

### Frontend polish
- [ ] `app/generate/page.tsx` — move skill generator from homepage to dedicated `/generate` route
- [ ] Update header nav: Home, Registry, Generate, Pricing, Dashboard
- [ ] SEO: `metadata` exports on all pages with proper titles and descriptions
- [ ] Loading skeletons on registry grid and workspace
- [ ] Error boundary components for scan failures and generation failures
- [ ] Mobile responsive audit: scanner, registry, workspace

### Infrastructure
- [ ] Rate limiting on `/api/scan`: 10 req/min per IP (Vercel edge config or upstash-ratelimit)
- [ ] Rate limiting on `/api/generate`: 5 req/min per user
- [ ] Vercel deployment: add all env vars
- [ ] Set `DODO_PAYMENTS_ENVIRONMENT=live_mode` for production
- [ ] Supabase: confirm RLS audit passes (re-run `get_advisors`)
- [ ] GitHub API: add `User-Agent: chisel/1.0` header to all requests (required by GitHub)

### Content
- [ ] Seed registry with 10–15 hand-crafted templates for popular stacks:
  - Next.js + TypeScript
  - Next.js + Supabase
  - Django + DRF
  - FastAPI
  - Go (standard layout)
  - React (Vite)
  - Rails
  - Node.js + Express
- [ ] Seed registry with 5–10 useful skills from existing marketplace

---

## Definition of Done (v2.0 Launch)

- [ ] User can scan a public GitHub repo and get a valid, useful `CLAUDE.md` in < 60s
- [ ] Registry has at least 10 community/seeded items browsable without login
- [ ] Skill generation works via OpenAI (same quality as Anthropic path)
- [ ] Solo plan: $9/mo via Dodo, 14-day trial, unlimited scans, 30 generations
- [ ] Team plan: $49/mo via Dodo, team workspace, 5 seats, 200 generations shared
- [ ] All tier gates enforced server-side
- [ ] No Anthropic dependencies remaining in the codebase
- [ ] Deployed to Vercel with all env vars set
