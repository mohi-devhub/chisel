# Chisel — Product Requirements Document

**Version:** 1.0 (MVP)  
**Status:** Draft  
**Author:** Mohith  

---

## 1. Overview

Chisel is a web application that lets users generate Claude Code skills from a plain-English description. Users describe what they want a skill to do, and Chisel produces a fully-structured `.skill` zip file (SKILL.md + scripts/ + references/ + assets/) ready to install into Claude Code. A public marketplace lets users browse, share, and discover community-built skills.

---

## 2. Problem Statement

Claude Code's skill system is powerful but authoring skills is a technical, time-consuming task. Most users — even experienced developers — don't know the SKILL.md schema, the progressive disclosure pattern, the YAML frontmatter requirements, or how to structure scripts and reference files. There is no tooling, no generator, and no community catalog. Chisel fills all three gaps.

---

## 3. Goals

- Let any user generate a valid, installable Claude Code skill from a natural language description in under 60 seconds.
- Provide a public marketplace for browsing and sharing free community skills.
- Monetize via advanced generation features (pro tier) with a future premium content layer (v2).

---

## 4. Non-Goals (MVP)

- Mobile app
- CLI tool (consider v2)
- Premium skill paywall / creator revenue share (v2, documented below)
- Skill testing / simulation inside Chisel
- Team/org accounts

---

## 5. User Personas

### Persona A — The Power User Developer
Uses Claude Code daily. Understands skills conceptually but doesn't want to hand-write SKILL.md files. Wants full-structure output with scripts and references. Likely to publish to the marketplace and build a reputation.

### Persona B — The Non-Technical Claude Code User
Discovered Claude Code recently. Can describe what they want in English but has never opened a SKILL.md. Needs a frictionless zero-config path to a working skill.

---

## 6. User Flows

### 6.1 Anonymous Generation (Free)
1. User lands on chisel.dev
2. Enters a plain-English skill description in the text box
3. Optionally selects: complexity level (Simple / Standard / Full), and which folders to include (scripts/, references/, assets/)
4. Clicks **Chisel It**
5. Claude API generates the full skill structure
6. User sees a preview of SKILL.md in the UI; scripts/references sections are visible but blurred with an upgrade overlay
7. User downloads the `.skill` zip file (SKILL.md only)
8. Counter decrements: 3 free generations lifetime (tracked via anonymous session + IP fingerprint)
9. At generation 2 (not 3), an inline upgrade nudge appears — don't wait until the wall

### 6.2 Account Creation Gate
- Triggered when: user tries to publish a skill, OR hits the 3-generation free limit
- Sign up / log in via Clerk (email + Google OAuth)
- On sign-up: existing anonymous generation count carries over via session linkage
- New accounts receive a 7-day Creator trial automatically

### 6.3 Authenticated — Free Tier
- Same as anonymous but generations tied to account (3 total across anonymous + authenticated sessions)
- Can view personal skill history
- Cannot publish to marketplace (requires Pro)
- Cannot generate scripts/, references/, assets/ (free tier = SKILL.md only)

### 6.4 Authenticated — Creator Tier
- 30 generations per month (monthly reset)
- Full structure output: SKILL.md + scripts/ + references/ + assets/
- Skill history
- Cannot publish to marketplace (requires Pro)
- Payment via Razorpay ₹399/month

### 6.5 Authenticated — Pro Tier
- 100 generations per month (monthly reset)
- Full structure output: SKILL.md + scripts/ + references/ + assets/
- Can publish skills to the public marketplace
- Skill history with version tracking
- Overage above 100: purchase a credit pack (₹199 for 20 generations) rather than auto-charging
- Payment via Razorpay ₹899/month or ₹7,499/year

### 6.5 Marketplace — Browse
- Public page, no login required
- Browse skills by category, sort by: newest / most downloaded / trending
- Each skill card shows: name, description, author, download count, tags
- Click → skill detail page with SKILL.md preview + download button

### 6.6 Marketplace — Publish (Pro only)
- Pro user fills in: skill name, description, tags, category
- Clicks Publish → skill appears on marketplace as free
- Author gets download analytics on their profile page

---

## 7. Features

### 7.1 Skill Generator
| Feature | Free | Creator (₹399/mo) | Pro (₹899/mo) |
|---|---|---|---|
| Generations | 3 lifetime | 30/month | 100/month |
| Overage | — | Buy credit pack | Buy credit pack |
| Output: SKILL.md | ✅ | ✅ | ✅ |
| Output: scripts/ | ❌ | ✅ | ✅ |
| Output: references/ | ❌ | ✅ | ✅ |
| Output: assets/ | ❌ | ✅ | ✅ |
| SKILL.md preview in UI | ✅ | ✅ | ✅ |
| Scripts/refs preview (blurred) | ✅ (blurred) | ✅ | ✅ |
| Download as .skill zip | ✅ | ✅ | ✅ |
| Generation history | ❌ | ✅ | ✅ |
| Publish to marketplace | ❌ | ❌ | ✅ |
| 7-day trial on signup | — | ✅ (auto) | — |

### 7.2 Marketplace
- Public skill catalog
- Search + filter by tags/category
- Skill detail page with preview
- Download button (free for all listed skills in v1)
- Author profile page (pro users)

### 7.3 Auth & Accounts
- Clerk for auth (email + Google OAuth)
- Profile page: generation history, published skills, download stats (pro)
- Upgrade prompt when free limit hit

### 7.4 Payments
- Razorpay integration
- Creator plan: ₹399/month
- Pro plan: ₹899/month or ₹7,499/year (≈ 30% saving, 2 months free)
- Credit pack: ₹199 for 20 generations (one-time, no subscription — captures users who won't commit monthly)
- Post-payment: Supabase user record updated to `tier = 'creator'` or `'pro'` via webhook only
- Post-credit-pack: `users.credits` incremented by 20 via webhook

---

## 8. V2 Features (Out of Scope for MVP — Documented for Architecture Awareness)

### 8.1 Premium Skill Marketplace
- Pro users can publish skills under a **Premium** tag with a set price (e.g., ₹49–₹499 per skill)
- Other users pay to download premium skills
- Revenue split: 70% to creator, 30% to Chisel
- Requires: Razorpay Connect or manual payout flow, creator wallet/dashboard

### 8.2 CLI Tool
- `npx chisel generate "describe your skill"` → outputs `.skill` file locally
- Authenticated via API key from Chisel dashboard

---

## 9. Pricing

| Plan | Price | Limit | Full structure | Marketplace |
|---|---|---|---|---|
| Free | ₹0 | 3 gens (lifetime) | ❌ | ❌ |
| Creator | ₹399/month | 30 gens/month | ✅ | ❌ |
| Pro | ₹899/month | 100 gens/month | ✅ | ✅ |
| Pro Annual | ₹7,499/year | 100 gens/month | ✅ | ✅ |
| Credit Pack | ₹199 (one-time) | +20 gens (any tier) | depends on tier | — |

Overage above plan cap: credits are consumed first; if credits = 0, generation is blocked with a prompt to buy a credit pack or upgrade.

---

## 10. Success Metrics (MVP)

- 500 skills generated in first 30 days
- 50 skills published to marketplace
- 15 Creator conversions in first 60 days
- 10 Pro conversions in first 60 days
- 5 credit pack purchases in first 60 days
- <5% invalid/broken skill downloads (quality metric)

---

## 11. Constraints & Risks

| Risk | Mitigation |
|---|---|
| Claude API generates invalid SKILL.md | Validate YAML frontmatter server-side before zip packaging |
| Anonymous session abuse (re-generate after clearing cookies) | IP fingerprint + device fingerprint as secondary gate |
| Anthropic ships a first-party skill marketplace | Marketplace + creator layer (v2) becomes the moat |
| Low Claude Code adoption | Positioned as early bet; low build cost justifies the risk |
