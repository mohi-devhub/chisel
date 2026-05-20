export type Tier = "free" | "solo" | "pro" | "team_owner" | "team_member";

export type Plan =
  | "solo_monthly"
  | "solo_yearly"
  | "pro_monthly"
  | "pro_yearly"
  | "team_monthly"
  | "team_yearly";

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
  scripts: Array<{ filename: string; content: string }>;
  references: Array<{ filename: string; content: string }>;
  assets: Array<{ filename: string; content: string }>;
  zip_base64: string;
  filename: string;
  remaining: number;
}

export interface AccountStatus {
  signedIn: boolean;
  tier: Tier;
  effectiveTier: Tier;
  remaining: number;
  canUseAdvanced: boolean;
}

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
}

export interface User {
  id: string;
  email: string;
  tier: Tier;
  org_id: string | null;
  gen_count: number;
  monthly_gen_count: number;
  monthly_scan_count: number;
  monthly_reset_at: string;
  trial_ends_at: string | null;
  created_at: string;
}

export interface RepoContext {
  owner: string;
  repo: string;
  branch: string;
  description: string | null;
  fileTree: string[];
  manifests: Record<string, string>;
  readme: string | null;
  existingClaudeMd: string | null;
  detectedStack: string[];
}

export interface ScanResult {
  claude_md: string;
  detected_stack: string[];
}

export interface RecommendedItem {
  id: string;
  type: "skill" | "template";
  name: string;
  description: string;
  stack: string[];
  install_count: number;
}

export interface ScanResponse {
  claude_md: string;
  detected_stack: string[];
  recommended_items: RecommendedItem[];
}
