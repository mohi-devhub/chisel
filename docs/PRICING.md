# Chisel Pricing Rationale

**Version:** 2.0 — Updated for OpenAI gpt-4o-mini and new plan structure.

Prices are in USD. Model assumes cost coverage at median usage with a healthy margin after payment processing fees.

---

## AI Cost Model (OpenAI gpt-4o-mini)

Current pricing (May 2026):
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

### Per Repo Scan
- Input: ~12,000 tokens (file tree + manifests + README + system prompt)
- Output: ~2,000 tokens (generated CLAUDE.md)
- Cost: `(12,000 × $0.15/1M) + (2,000 × $0.60/1M)` = `$0.0018 + $0.0012` = **$0.003/scan**

### Per Skill Generation
- Input: ~10,000 tokens (2 attempts × system prompt + user prompt)
- Output: ~4,000 tokens (JSON skill payload)
- Cost: `(10,000 × $0.15/1M) + (4,000 × $0.60/1M)` = `$0.0015 + $0.0024` = **$0.0039/gen**

### $50 OpenAI credit runway
- Scans: $50 / $0.003 ≈ **16,600 scans**
- Generations: $50 / $0.0039 ≈ **12,800 generations**

At early stage volume (e.g., 200 scans + 300 generations/month), cost is approximately **$1.77/month** — essentially free. $50 covers ~2 years of early-stage usage.

---

## Assumptions

- Hosting: Vercel Pro ($20/month) + Supabase Pro ($25/month) = $45/month fixed
- Amortized across 20 active paid users: **$2.25/user/month**, rounded to **$2.50/user/month**
- Median Solo user: 10 scans + 15 generations/month
- Median Team (5 members): 25 scans + 40 generations/month
- Dodo Payments fee model: `5.5% + $0.40` for subscriptions (4% base + 1.5% international)

---

## Formula

```
price = ((cost_basis × 1.5) + $0.40) / (1 - 0.055)
```

---

## Plan Costs

### Solo ($9/month)
| Item | Calculation | Cost |
|---|---|---|
| 10 scans | 10 × $0.003 | $0.03 |
| 15 generations | 15 × $0.0039 | $0.059 |
| Hosting allocation | fixed/users | $2.50 |
| **Total cost basis** | | **$2.59** |

Minimum price: `(($2.59 × 1.5) + $0.40) / (1 - 0.055)` = `$4.50`  
Published price: **$9/month** — 2× above floor. Comfortable margin even at 2× median usage.

### Team ($49/month)
| Item | Calculation | Cost |
|---|---|---|
| 25 scans | 25 × $0.003 | $0.075 |
| 40 generations | 40 × $0.0039 | $0.156 |
| Hosting allocation | 5 seats × $2.50 | $12.50 |
| **Total cost basis** | | **$12.73** |

Minimum price: `(($12.73 × 1.5) + $0.40) / (1 - 0.055)` = `$21.53`  
Published price: **$49/month** — 2.3× above floor. Strong margin for team tier.

---

## Summary Table

| Plan | Price | Monthly Cost Basis | Net Revenue (after fees) | Margin |
|---|---|---|---|---|
| Solo | $9/month | ~$2.59 | ~$8.11 | ~68% |
| Team | $49/month | ~$12.73 | ~$44.01 | ~71% |

---

## Why No Annual Plans (v1)

Annual plans add billing complexity (prorated cancellations, refund policies) without a strong retention signal this early. Add annual discounts in v2 once monthly churn data is available.

## Why No Credit Packs (v1)

Credit packs address overage anxiety — a problem worth solving only once users are hitting limits regularly. At 30 generations/month for Solo, most users won't hit the cap. Simplify v1 pricing; add credit packs in v2 if data shows users hitting limits.

---

## Break-Even Analysis

Fixed costs: $45/month (Vercel + Supabase).

| Paying users | Monthly revenue | Fixed costs | Net |
|---|---|---|---|
| 5 Solo | $45 | $45 | $0 (break-even) |
| 10 Solo | $90 | $45 | +$45 |
| 1 Team + 5 Solo | $94 | $45 | +$49 |
| 3 Team + 10 Solo | $237 | $45 | +$192 |

Break-even requires **5 Solo subscribers** or **1 Team subscriber**. Very achievable.
