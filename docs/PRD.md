# Chisel — Product Requirements Document

**Version:** 2.0  
**Status:** Active  
**Author:** Mohith  

---

## 1. Overview

Chisel is the configuration layer for Claude Code. It solves the biggest friction point in Claude Code adoption: every project and every team has to figure out `CLAUDE.md`, skills, hooks, and MCP server configuration from scratch, with no tooling, no community catalog, and no way to share what works.

Chisel ships three things:

1. **Repo Scanner** — Point Chisel at any codebase. It reads the stack, structure, and docs and generates an optimized `CLAUDE.md` plus a recommended skill list in under 60 seconds. This is the hero feature.
2. **Registry** — A community catalog of `CLAUDE.md` templates and skills organized by stack, language, and use case. Browse free; publish and install with an account.
3. **Skill Generator** — Describe a workflow in plain English; Chisel generates a valid `.skill` zip ready to install. Supplementary to the scanner but still useful for custom one-off skills.

Team accounts add a private workspace: shared templates, skills, and configurations that stay in sync across every developer on the team.

---

## 2. Problem Statement

Claude Code is powerful but hard to configure well. The problems are:

- **CLAUDE.md is a blank page.** Most users skip it or write something minimal. A good CLAUDE.md dramatically improves Claude Code's usefulness, but there is no tooling to generate one, no templates to start from, and no community to learn from.
- **Skills are unknown.** Most Claude Code users have never installed a skill. The schema is documented but authoring is tedious and the discovery story is nonexistent.
- **Teams have no shared layer.** Each developer on a team configures Claude Code independently. There is no way to share a `CLAUDE.md`, a skill set, or hook configuration across a project.
- **Onboarding a new project is slow.** Adding a new developer or starting a new repo means starting over on configuration.

Chisel fixes all of these.

---

## 3. Goals

- A developer can scan any repo and get a production-quality `CLAUDE.md` + skill recommendations in under 60 seconds.
- A team can publish their Claude Code configuration and have every member install it with one command.
- The registry becomes the de-facto community hub for Claude Code configs, templates, and skills.
- Skill generation remains available as a fast path to creating custom skills.
- The product is self-sustaining: revenue from Solo and Team subscriptions covers AI API and hosting costs with healthy margin.

---

## 4. Non-Goals (v2)

- CLI tool (`npx chisel scan`) — planned v2
- MCP server configuration templates — planned v2
- Hook configuration templates — planned v2
- Analytics dashboard (team Claude Code usage insights) — planned v2
- Claude Code skill testing / simulation inside Chisel — planned v2
- Premium paid skills in the registry (creator revenue share) — planned v2
- Enterprise SSO / audit logs — planned v2

---

## 5. User Personas

### Persona A — The Solo Developer
Uses Claude Code daily on personal or freelance projects. Knows what CLAUDE.md is but has never written a good one. Wants to scan their repo, get a working config, and move on. Will pay Solo tier if the scan saves them an hour.

### Persona B — The Team Lead
Runs a small engineering team (3–8 devs) adopting Claude Code. Wants every developer configured identically. Currently copy-pastes config over Slack. Will pay Team tier to have a shared workspace that new hires can install on day one.

### Persona C — The Community Contributor
Power user who has built excellent `CLAUDE.md` templates for specific stacks (e.g., "Next.js + Supabase", "Django REST API"). Wants to publish them to the registry and build a reputation. Doesn't need to be paid — visibility is enough for v1.

---

## 6. User Flows

### 6.1 Repo Scan (Hero Flow)
1. User lands on chisel.dev. Hero is: **"Configure Claude Code for any project in 60 seconds."**
2. User pastes a GitHub repo URL (or uploads a zip for private repos)
3. Chisel fetches the repo structure: file tree, `package.json` / `pyproject.toml` / `go.mod`, `README.md`, and any existing `CLAUDE.md`
4. OpenAI (gpt-4o-mini) generates:
   - A full `CLAUDE.md` tailored to the detected stack
   - A list of 3–5 recommended skills from the registry
5. User sees the generated `CLAUDE.md` in a split preview (editable)
6. User downloads `CLAUDE.md` or copies to clipboard
7. Unauthenticated users get **1 free scan**, then hit the sign-up gate
8. Authenticated Solo/Team users get unlimited scans

### 6.2 Sign-Up & Trial
- Triggered when unauthenticated user tries a second scan, or manually visits `/sign-up`
- Sign up via Clerk (email or Google OAuth)
- 14-day full trial, **no credit card required**
- Trial users get full Solo tier access
- After 14 days: prompt to subscribe or downgrade to free (0 scans/gens)

### 6.3 Registry — Browse
- Public page, no login required
- Two tabs: **Templates** (CLAUDE.md configs) and **Skills**
- Each item shows: name, description, stack tags, install count, author
- Filter by: stack/language, category, sort by newest / most installed
- Click → detail page with full preview + install/download button

### 6.4 Registry — Publish (Solo or Team)
- Authenticated user with active subscription visits `/registry/publish`
- Selects type: Template or Skill
- For Templates: paste or upload `CLAUDE.md` + fill name, description, stack tags
- For Skills: generates via skill generator or uploads existing `.skill` zip
- Published item appears in registry under their profile

### 6.5 Skill Generation
- Secondary feature, accessible via `/generate` or from the dashboard
- User describes a workflow in plain English
- Selects complexity (Simple / Standard / Full) and optional folders (scripts/, references/, assets/)
- OpenAI generates and returns a `.skill` zip
- Solo: 30 generations/month. Team: 200/month shared pool.

### 6.6 Team Workspace
- Team account created by a Team subscriber (the "owner")
- Owner invites members via email (up to 5 seats on base Team plan)
- Workspace contains: team templates, team skills, pinned registry items
- Any member can install any workspace item in one click
- Owner can push a workspace config to all members (future: one-command install via CLI)

### 6.7 Dashboard
- Generation history (skills generated, downloadable)
- Published registry items with install counts
- Team workspace (if on Team plan)
- Subscription + billing management

---

## 7. Features

### 7.1 Repo Scanner
| Capability | Detail |
|---|---|
| Input methods | GitHub public URL, GitHub private URL (future: GitHub OAuth), zip upload |
| Repo analysis | File tree (depth 3), package manifests, README, existing CLAUDE.md |
| Output | `CLAUDE.md` tailored to detected stack + 3–5 skill recommendations from registry |
| Editable preview | Split-pane: generated CLAUDE.md on right, editable on left before download |
| Copy / Download | Copy to clipboard or download as `CLAUDE.md` |
| Free quota | 1 scan unauthenticated, unlimited for authenticated subscribers |
| Supported stacks | Auto-detected: Next.js, React, Vue, Django, FastAPI, Rails, Go, Rust, and more via manifest inspection |

### 7.2 Registry
| Capability | Detail |
|---|---|
| Item types | CLAUDE.md templates, `.skill` zips |
| Discovery | Search, filter by stack/language/category, sort by newest/most installed |
| Detail page | Full preview (CLAUDE.md rendered, SKILL.md in terminal pane), install/download button |
| Publishing | Any Solo or Team subscriber can publish; free users can browse only |
| Install tracking | `install_count` incremented on each download; shown on item card |

### 7.3 Skill Generator
| Feature | Free | Solo ($9/mo) | Team ($49/mo) |
|---|---|---|---|
| Monthly generations | 0 | 30 | 200 (shared pool) |
| Output: SKILL.md | ❌ | ✅ | ✅ |
| Output: scripts/ | ❌ | ✅ | ✅ |
| Output: references/ | ❌ | ✅ | ✅ |
| Output: assets/ | ❌ | ✅ | ✅ |
| Publish to registry | ❌ | ✅ | ✅ |
| 14-day trial on signup | — | ✅ (auto) | ✅ (auto) |

### 7.4 Team Workspace
| Feature | Solo | Team |
|---|---|---|
| Private template library | ❌ | ✅ |
| Shared skill library | ❌ | ✅ |
| Team members | 1 | Up to 5 seats |
| Workspace install link | ❌ | ✅ |
| Usage per member | Individual | Shared generation pool |

### 7.5 Auth & Accounts
- Clerk (email + Google OAuth)
- 14-day trial on every new account, no credit card
- Dashboard: history, registry items, team workspace (if applicable)

### 7.6 Payments
- Dodo Payments
- Solo: $9/month
- Team: $49/month (up to 5 seats; additional seats TBD in v2)
- Annual plans: v2
- No credit packs in v2.0 (simplified pricing)

---

## 8. Pricing

| Plan | Price | Repo Scans | Generations | Registry | Team Workspace |
|---|---|---|---|---|---|
| Free | $0 | 1 (unauth) | 0 | Browse only | ❌ |
| Solo | $9/month | Unlimited | 30/month | Publish ✅ | ❌ |
| Team | $49/month | Unlimited | 200/month shared | Publish ✅ | ✅ (5 seats) |
| Trial | 14 days free | Unlimited | 30/month | Publish ✅ | ❌ |

Overage: if a Solo user exceeds 30 generations, generation is blocked with an upgrade prompt (no credit packs in v1 — keep it simple).

---

## 9. V2 Features (Out of Scope — Documented for Architecture Awareness)

### 9.1 CLI Tool
- `npx chisel scan` — scans the current working directory, outputs `CLAUDE.md`
- `npx chisel install <registry-id>` — installs a skill or template from the registry
- Authenticated via API key from dashboard

### 9.2 MCP Server Registry
- Community-published MCP server configurations (server URL, env vars needed, description)
- Installable via the dashboard or CLI
- Links to official MCP server repos

### 9.3 Premium Registry
- Creators can publish templates or skills at a price ($1.99–$19.99)
- Revenue split: 70% creator, 30% Chisel
- Requires Dodo Payments marketplace payout flow

### 9.4 Analytics Dashboard
- Team view: which Claude Code features your team uses most
- Hook firing frequency, skill invocation counts, generation patterns
- Requires a logging layer and background aggregation job

### 9.5 Enterprise
- SSO via SAML/OIDC
- Unlimited seats, org-level policy enforcement
- Audit log of all configuration changes
- Custom registry (air-gapped / internal only)

---

## 10. Success Metrics (v2.0 Launch)

- 200 repo scans in first 30 days
- 100 registry items published by community in first 60 days
- 30 Solo conversions in first 60 days
- 5 Team conversions in first 60 days
- Scanner generates a valid, useful `CLAUDE.md` for >90% of scanned repos

---

## 11. Constraints & Risks

| Risk | Mitigation |
|---|---|
| OpenAI generates invalid CLAUDE.md | Validate frontmatter + structure server-side; retry once with correction prompt |
| GitHub API rate limits on public repo fetch | Cache repo structure; use unauthenticated API for public repos (60 req/hr); prompt for GitHub OAuth for private repos |
| Registry quality degrades over time | Moderation queue for reported items; auto-hide items with zero installs after 90 days |
| Anthropic ships a first-party registry | Head start + community moat; pivot to CLI and team tooling if needed |
| Low Claude Code adoption | Low build cost justifies the bet; product is useful the moment Claude Code adoption grows |
| OpenAI API cost overrun | Cost per scan is ~$0.005 (gpt-4o-mini); $50 credit covers 10,000 scans — essentially unlimited for early stage |
