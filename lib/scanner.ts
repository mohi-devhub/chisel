import OpenAI from "openai";

import type { RepoContext, ScanResult } from "@/types";

const SCAN_ATTEMPTS = 2;
const SCANNER_MODEL = "gpt-4o-mini";

const systemPrompt = `You are an expert developer tools engineer. Generate a CLAUDE.md file for a GitHub repository.

CLAUDE.md is the configuration file for Claude Code (an AI coding assistant). It tells Claude about the project so it can help more effectively. It should include:
- Project overview: what this repo does and why it exists
- Tech stack: key languages, frameworks, and dependencies
- Repository structure: what lives where (top-level dirs)
- Common commands: build, run, test, lint, migrate, deploy — use actual commands from the project
- Architecture notes: key design decisions, patterns, constraints
- Code conventions: naming, style, any project-specific rules

Rules:
1. Be specific and concrete — reference actual files, dirs, and commands from this repo
2. Generic filler ("follow best practices") is useless, omit it
3. Keep it concise — under 400 lines; Claude reads this on every request
4. Use markdown headers for organization
5. If an existing CLAUDE.md is provided, improve it — don't just copy it

Respond ONLY with JSON in this exact shape:
{
  "claude_md": "# full CLAUDE.md content as a string",
  "detected_stack": ["nextjs", "typescript", "supabase"]
}

detected_stack: short lowercase tags. Valid values include: nextjs, react, vue, angular, svelte, express, fastapi, django, flask, rails, go, rust, java, spring, python, nodejs, typescript, supabase, prisma, drizzle, tailwind, docker, testing, vite, hono, elixir`;

export function buildScanPrompt(context: RepoContext, attempt = 1): string {
  const retryNote =
    attempt > 1 ? "\nPrevious response failed to parse. Return strictly valid JSON only." : "";

  const lines: string[] = [
    `Repository: ${context.owner}/${context.repo}`,
    context.description ? `Description: ${context.description}` : "",
    `Default branch: ${context.branch}`,
    `Detected stack: ${context.detectedStack.join(", ") || "unknown"}`,
    "",
    "## File tree (filtered, first 150 paths)",
    context.fileTree.slice(0, 150).join("\n"),
  ];

  for (const [path, content] of Object.entries(context.manifests)) {
    lines.push(`\n## ${path}\n\`\`\`\n${content}\n\`\`\``);
  }

  if (context.readme) {
    lines.push(`\n## README\n${context.readme}`);
  }

  if (context.existingClaudeMd) {
    lines.push(`\n## Existing CLAUDE.md (improve on this)\n${context.existingClaudeMd}`);
  }

  lines.push(retryNote, "\nGenerate the CLAUDE.md now. Return JSON only.");

  return lines.filter(Boolean).join("\n");
}

export async function scanRepo(context: RepoContext): Promise<ScanResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? SCANNER_MODEL;

  let lastError: unknown;

  for (let attempt = 1; attempt <= SCAN_ATTEMPTS; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 4096,
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildScanPrompt(context, attempt) },
        ],
      });

      const text = response.choices[0]?.message?.content?.trim() ?? "";
      return parseScanResult(text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Scanner returned invalid output");
}

function parseScanResult(text: string): ScanResult {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Partial<ScanResult>;

  if (!parsed.claude_md || typeof parsed.claude_md !== "string") {
    throw new Error("Scanner response missing claude_md");
  }

  return {
    claude_md: parsed.claude_md,
    detected_stack: Array.isArray(parsed.detected_stack) ? parsed.detected_stack : [],
  };
}
