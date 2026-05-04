import Anthropic from "@anthropic-ai/sdk";

import type { GeneratedSkill, GenerateRequest } from "@/types";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const GENERATION_ATTEMPTS = 2;

const systemPrompt = `You are an expert at writing Claude Code skills.

A skill is a structured folder that can contain:
- SKILL.md: YAML frontmatter with name and description, followed by concise markdown instructions.
- scripts/: deterministic Python or shell scripts.
- references/: longer markdown documentation loaded only when needed.
- assets/: static files such as templates or examples.

Rules:
1. SKILL.md must begin with valid YAML frontmatter delimited by ---.
2. Frontmatter must include string fields named "name" and "description".
3. The description must explain when Claude Code should trigger the skill. Make it specific and actionable.
4. Keep SKILL.md focused and under 500 lines. Put longer detail in references when requested.
5. Scripts are only for deterministic, repetitive, or computational tasks.
6. File names must be relative names only. Do not include absolute paths, parent directory traversal, or markdown fences.

Respond only with JSON in this exact shape:
{
  "name": "folder-safe-skill-name",
  "skill_md": "full SKILL.md content as a string",
  "scripts": [{ "filename": "example.py", "content": "..." }],
  "references": [{ "filename": "guide.md", "content": "..." }],
  "assets": [{ "filename": "template.txt", "content": "..." }]
}`;

export function buildPrompt(request: GenerateRequest, attempt = 1) {
  const retryInstruction =
    attempt > 1
      ? "\nPrevious response could not be parsed or validated. Return strictly valid JSON with valid SKILL.md YAML frontmatter."
      : "";

  return `Generate a Claude Code skill for the following request.

Description:
${request.description}

Complexity: ${request.complexity}
Include scripts: ${request.include.scripts}
Include references: ${request.include.references}
Include assets: ${request.include.assets}
${retryInstruction}

Return JSON only.`;
}

export async function generateSkill(
  request: GenerateRequest
): Promise<GeneratedSkill> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  let lastError: unknown;

  for (let attempt = 1; attempt <= GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const response = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
        max_tokens: 4096,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: "user", content: buildPrompt(request, attempt) }],
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      return parseGeneratedSkill(text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Claude returned an invalid skill payload");
}

export function parseGeneratedSkill(text: string): GeneratedSkill {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Partial<GeneratedSkill>;
  return normalizeGeneratedSkill(parsed);
}

export function validateSkillMarkdown(skillMd: string) {
  const match = skillMd.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    throw new Error("SKILL.md must start with YAML frontmatter");
  }

  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim();
  const description = frontmatter
    .match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1]
    ?.trim();

  if (!name || !description) {
    throw new Error("SKILL.md frontmatter must include name and description");
  }
}

function normalizeGeneratedSkill(
  value: Partial<GeneratedSkill>
): GeneratedSkill {
  if (!value || typeof value !== "object") {
    throw new Error("Claude returned an invalid skill payload");
  }

  if (!value.skill_md || typeof value.skill_md !== "string") {
    throw new Error("Claude response is missing skill_md");
  }

  const name =
    typeof value.name === "string" && value.name.trim()
      ? value.name
      : readNameFromFrontmatter(value.skill_md);

  if (!name) {
    throw new Error("Claude response is missing skill name");
  }

  validateSkillMarkdown(value.skill_md);

  return {
    name: sanitizeSkillName(name),
    skill_md: value.skill_md,
    scripts: normalizeFiles(value.scripts),
    references: normalizeFiles(value.references),
    assets: normalizeFiles(value.assets),
  };
}

function normalizeFiles(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (file): file is { filename: string; content: string } =>
        typeof file?.filename === "string" &&
        typeof file?.content === "string"
    )
    .map((file) => ({
      filename: sanitizeRelativePath(file.filename),
      content: file.content,
    }))
    .filter((file) => file.filename.length > 0);
}

function readNameFromFrontmatter(skillMd: string) {
  return skillMd.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? "";
}

function sanitizeSkillName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "generated-skill"
  );
}

function sanitizeRelativePath(path: string) {
  return path
    .replaceAll("\\", "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/")
    .slice(0, 120);
}
