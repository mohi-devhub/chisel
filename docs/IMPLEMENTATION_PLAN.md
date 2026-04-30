# Chisel — Implementation Plan

Ordered build sequence for Claude Code. Complete phases in order — each phase is independently shippable.

---

## Phase 0 — Project Bootstrap

- [ ] Verify Node.js ≥ 22.2 (`node --version`) — required by razorpay SDK
- [ ] `pnpm create next-app@16 chisel --typescript --tailwind --app`
- [ ] Install dependencies (pinned):
  ```
  pnpm add @clerk/nextjs@7 @supabase/supabase-js@2 jszip@3 razorpay@2
  pnpm add @anthropic-ai/sdk@0
  ```
  Note: JSZip ships its own types — no `@types/jszip` needed.
- [ ] Set up shadcn/ui: `pnpm dlx shadcn@latest init`
- [ ] Add components: button, input, textarea, card, badge, tabs, dialog
- [ ] Create `.env.local` with all required keys (see ARCHITECTURE.md §10)
- [ ] Set up Clerk: wrap `app/layout.tsx` with `<ClerkProvider>`
- [ ] Create `middleware.ts` with Clerk route protection rules
- [ ] Set up Supabase: create project, run schema migrations (all 5 tables)
- [ ] Create two Supabase storage buckets: `chisel-skills` (private), `chisel-marketplace` (public)

---

## Phase 1 — Core Generation (No Auth)

**Goal:** Anonymous user can describe a skill and download a zip.

- [ ] `lib/anthropic.ts` — Claude API client, `buildPrompt()`, `generateSkill()`, JSON response parser with retry
- [ ] `lib/packaging.ts` — `packageSkill(generated) → Buffer` using JSZip
- [ ] `lib/fingerprint.ts` — `getFingerprint(req)` using IP + User-Agent hash
- [ ] `lib/quota.ts` — `checkQuota(fingerprint | userId)` → `{ allowed: boolean, remaining: number }`
- [ ] `app/api/generate/route.ts` — Full generation endpoint (fingerprint → quota check → Claude → validate → zip → upload → return binary)
- [ ] `components/generator/DescriptionInput.tsx` — Textarea with char counter
- [ ] `components/generator/PreviewPane.tsx` — Shows SKILL.md content after generation
- [ ] `components/generator/DownloadButton.tsx` — Triggers download of binary response
- [ ] `app/page.tsx` — Landing page with generator UI, generation counter display

**Test:** Generate a skill anonymously, download zip, verify structure.

---

## Phase 2 — Auth + Tier Enforcement

**Goal:** Accounts, quota tied to user, pro gate on advanced output.

- [ ] `app/(auth)/sign-in/page.tsx` and `sign-up/page.tsx` — Clerk hosted pages
- [ ] Supabase `users` row creation on Clerk `user.created` webhook
- [ ] Update `app/api/generate/route.ts` — detect Clerk session, enforce tier gates server-side
- [ ] Anonymous → authenticated gen_count carry-over on sign-up (session cookie linkage)
- [ ] `components/generator/OptionsPanel.tsx` — Scripts/References/Assets checkboxes (pro-gated with upgrade tooltip)
- [ ] Upgrade nudge shown inline at generation 2 (before the hard wall at 3)
- [ ] Upgrade prompt modal when free user hits 3-generation limit
- [ ] On sign-up: set `trial_ends_at = now() + 7 days`, carry over anonymous gen_count
- [ ] Trial users treated as creator tier in quota and output logic

**Test:** Hit 3 generations anonymously, see gate. Sign up, verify 7-day trial activates and carry-over applies. Verify scripts checkbox blocked for free user at API level but accessible during trial.

---

## Phase 3 — Payments (Razorpay)

**Goal:** Free users can upgrade to Creator or Pro; any user can buy a credit pack.

- [ ] `lib/razorpay.ts` — Razorpay SDK wrapper, `createOrder()`, `verifyWebhookSignature()`
- [ ] `app/api/payments/create-order/route.ts` — supports plans: `creator_monthly`, `pro_monthly`, `pro_annual`, `credit_pack`
- [ ] `app/api/payments/webhook/route.ts` — Signature verification; on `payment.captured`:
  - `creator_monthly` → `users.tier = 'creator'`
  - `pro_monthly` / `pro_annual` → `users.tier = 'pro'`
  - `credit_pack` → `users.credits += 20`
- [ ] `app/pricing/page.tsx` — Three-column plan table (Creator / Pro / Pro Annual) + credit pack add-on section + Razorpay checkout trigger
- [ ] Frontend Razorpay checkout integration (load Razorpay.js, open checkout modal)
- [ ] Post-payment redirect → dashboard with success toast

**Test:** Complete test payments for each plan type, verify correct `users.tier` and `users.credits` updates via webhook only (not frontend callback).

---

## Phase 4 — Dashboard

**Goal:** Authenticated users can see their history.

- [ ] `app/dashboard/page.tsx` — Auth-gated, shows:
  - Generation history (list of skills with name, date, download link)
  - Pro users: published marketplace skills + download counts
- [ ] `app/api/dashboard/skills/route.ts` — Fetch user's skills from Supabase
- [ ] Re-download endpoint: generate signed URL for previously generated skill zip

**Test:** Generate 3 skills, sign in, verify history appears.

---

## Phase 5 — Marketplace

**Goal:** Public skill catalog, pro users can publish.

- [ ] `app/marketplace/page.tsx` — Grid of skill cards, filter by category/tags, sort
- [ ] `app/marketplace/[id]/page.tsx` — Skill detail: name, description, tags, author, SKILL.md preview, download button
- [ ] `app/api/marketplace/route.ts` — Paginated listing fetch with filters
- [ ] `app/api/marketplace/[id]/download/route.ts` — Increment download count + return signed URL
- [ ] `app/api/publish/route.ts` — Pro-only publish endpoint
- [ ] `components/marketplace/SkillCard.tsx`
- [ ] `components/marketplace/FilterBar.tsx`
- [ ] Publish flow in dashboard: "Publish to Marketplace" button on skill history items (pro only)

**Test:** Publish a skill as pro user, find it on marketplace, download as anonymous user.

---

## Phase 6 — Polish & Launch Prep

- [ ] SEO: `metadata` exports on all pages
- [ ] Loading states: skeleton cards on marketplace, spinner on generation
- [ ] Error states: generation failure UI, network error handling
- [ ] Rate limiting on `/api/generate`: max 10 req/min per IP (middleware or Vercel edge config)
- [ ] Razorpay test → production key swap
- [ ] Vercel deployment + environment variables
- [ ] Supabase RLS policies audit
- [ ] README.md

---

## Definition of Done (MVP)

- [ ] Anonymous user can generate a SKILL.md-only skill and download zip
- [ ] Free tier enforces 3-generation lifetime limit across anonymous + authenticated sessions
- [ ] Pro tier unlocks unlimited + full structure
- [ ] Razorpay payment upgrades tier via webhook (not frontend)
- [ ] Marketplace shows published skills, anyone can download
- [ ] Only pro users can publish to marketplace
- [ ] All pro-only gates enforced server-side (not just UI)
