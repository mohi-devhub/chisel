import OpenAI from "openai";

import type { GeneratedSkill, GenerateRequest } from "@/types";

const DEFAULT_MODEL = "gpt-4o-mini";
const GENERATION_ATTEMPTS = 2;

const systemPrompt = `You are an expert at writing Claude Code skills.

A skill is a structured folder that contains:
- SKILL.md: YAML frontmatter with name and description, followed by markdown instructions.
- scripts/: Python or shell scripts that automate tasks.
- references/: longer markdown docs or guides loaded as context.
- assets/: static files such as templates, config examples, or sample outputs.

Rules:
1. SKILL.md must begin with valid YAML frontmatter delimited by ---.
2. Frontmatter must include string fields "name" and "description".
3. The description explains when Claude Code should use the skill — make it specific.
4. File names must be relative names only. No absolute paths, no "..", no markdown fences.
5. MANDATORY: if the user requests scripts, references, or assets, you MUST populate those arrays. Non-empty arrays are required — do not return empty arrays for requested folders.
6. For "full" complexity, write comprehensive instructions with multiple steps, examples, and edge cases. Populate ALL requested folder arrays with rich, useful content.
7. For "standard" complexity, write practical instructions with a few examples.
8. For "simple" complexity, write short focused instructions.

Respond ONLY with JSON in this exact shape — no other text:
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

  const folderRequirements: string[] = [];
  if (request.include.scripts) {
    folderRequirements.push("- MUST include at least one file in the scripts/ array (a real, working script).");
  }
  if (request.include.references) {
    folderRequirements.push("- MUST include at least one file in the references/ array (a detailed markdown reference doc).");
  }
  if (request.include.assets) {
    folderRequirements.push("- MUST include at least one file in the assets/ array (a useful template or example file).");
  }

  const complexityGuidance =
    request.complexity === "full"
      ? "Write comprehensive instructions: multiple numbered steps, concrete examples, edge cases, and gotchas. This is a full-complexity skill — be thorough."
      : request.complexity === "standard"
        ? "Write practical instructions with at least one usage example."
        : "Write short, focused instructions for a narrow workflow.";

  return `Generate a Claude Code skill for the following request.

Description:
${request.description}

Complexity: ${request.complexity}
${complexityGuidance}

Folder requirements:
${folderRequirements.length > 0 ? folderRequirements.join("\n") : "- Only SKILL.md is required (no extra folders)."}
${retryInstruction}

Return JSON only.`;
}

export async function generateSkill(
  request: GenerateRequest
): Promise<GeneratedSkill> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

  let lastError: unknown;

  for (let attempt = 1; attempt <= GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 8192,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildPrompt(request, attempt) },
        ],
      });

      const text = response.choices[0]?.message?.content?.trim() ?? "";
      return parseGeneratedSkill(text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OpenAI returned an invalid skill payload");
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
    throw new Error("OpenAI returned an invalid skill payload");
  }

  if (!value.skill_md || typeof value.skill_md !== "string") {
    throw new Error("OpenAI response is missing skill_md");
  }

  const name =
    typeof value.name === "string" && value.name.trim()
      ? value.name
      : readNameFromFrontmatter(value.skill_md);

  if (!name) {
    throw new Error("OpenAI response is missing skill name");
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
