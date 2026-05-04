export type Tier = "free" | "creator" | "pro";

export type Plan =
  | "creator_monthly"
  | "pro_monthly"
  | "pro_annual"
  | "credit_pack";

export interface GeneratedSkill {
  name: string;
  skill_md: string;
  scripts: Array<{ filename: string; content: string }>;
  references: Array<{ filename: string; content: string }>;
  assets: Array<{ filename: string; content: string }>;
}

export interface GenerateRequest {
  description: string;
  complexity: "simple" | "standard" | "full";
  include: {
    scripts: boolean;
    references: boolean;
    assets: boolean;
  };
}

export interface GenerateResponse {
  name: string;
  skill_md: string;
  zip_base64: string;
  filename: string;
  remaining: number;
}

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
}

export interface User {
  id: string;
  email: string;
  tier: Tier;
  gen_count: number;
  monthly_gen_count: number;
  monthly_reset_at: string;
  credits: number;
  trial_ends_at: string | null;
  created_at: string;
}
