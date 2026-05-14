import type { RepoContext } from "@/types";

const GITHUB_API_BASE = "https://api.github.com";
const USER_AGENT = "chisel/1.0";

const MANIFEST_PATHS = [
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "Gemfile",
  "pom.xml",
  "build.gradle",
  "composer.json",
  "mix.exs",
  "tsconfig.json",
  "next.config.ts",
  "next.config.js",
  "vite.config.ts",
  "vite.config.js",
  "Dockerfile",
  "deno.json",
  "deno.jsonc",
];

const SKIP_PREFIXES = [
  "node_modules/",
  "vendor/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  "__pycache__/",
  ".venv/",
  "venv/",
  "target/",
  ".cargo/",
];

const SKIP_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".eot",
  ".pdf", ".zip", ".tar", ".gz",
  ".lock", ".sum",
  ".min.js", ".min.css",
];

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: githubHeaders() });
  if (res.status === 404) throw new Error("Repository not found or is private");
  if (res.status === 403 || res.status === 429) throw new Error("GitHub rate limit exceeded — try again later");
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } {
  const clean = url.trim().replace(/\.git$/, "");
  const match = clean.match(/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\/(?:tree|blob)\/([^/\s]+))?(?:\/|$)/);
  if (!match) throw new Error("Not a valid GitHub repository URL");
  return { owner: match[1], repo: match[2], branch: match[3] };
}

async function fetchRepoInfo(owner: string, repo: string) {
  return fetchJSON<{ default_branch: string; description: string | null; private: boolean }>(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}`
  );
}

async function fetchRepoTree(owner: string, repo: string, ref: string): Promise<string[]> {
  const tree = await fetchJSON<{
    tree: Array<{ path: string; type: string }>;
    truncated: boolean;
  }>(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`);

  return tree.tree
    .filter((item) => item.type === "blob")
    .filter((item) => !SKIP_PREFIXES.some((p) => item.path.startsWith(p)))
    .filter((item) => !SKIP_EXTENSIONS.some((ext) => item.path.endsWith(ext)))
    .map((item) => item.path)
    .slice(0, 300);
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const file = await fetchJSON<{ content: string; encoding: string }>(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
    );
    if (file.encoding === "base64") {
      return Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf-8");
    }
    return file.content;
  } catch {
    return null;
  }
}

export function detectStack(manifests: Record<string, string>): string[] {
  const stack = new Set<string>();

  const pkgJson = manifests["package.json"];
  if (pkgJson) {
    stack.add("nodejs");
    try {
      const pkg = JSON.parse(pkgJson) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["next"]) stack.add("nextjs");
      if (deps["react"] && !deps["next"]) stack.add("react");
      if (deps["vue"]) stack.add("vue");
      if (deps["@angular/core"]) stack.add("angular");
      if (deps["svelte"]) stack.add("svelte");
      if (deps["express"]) stack.add("express");
      if (deps["fastify"]) stack.add("fastify");
      if (deps["hono"]) stack.add("hono");
      if (deps["typescript"] || deps["ts-node"] || deps["tsx"]) stack.add("typescript");
      if (deps["@supabase/supabase-js"]) stack.add("supabase");
      if (deps["prisma"] || deps["@prisma/client"]) stack.add("prisma");
      if (deps["drizzle-orm"]) stack.add("drizzle");
      if (deps["tailwindcss"]) stack.add("tailwind");
      if (deps["vitest"] || deps["jest"]) stack.add("testing");
      if (deps["vite"] && !deps["next"]) stack.add("vite");
    } catch { /* ignore */ }
  }

  if (manifests["pyproject.toml"] || manifests["requirements.txt"]) {
    stack.add("python");
    const content = manifests["pyproject.toml"] ?? manifests["requirements.txt"] ?? "";
    if (/django/i.test(content)) stack.add("django");
    if (/fastapi/i.test(content)) stack.add("fastapi");
    if (/flask/i.test(content)) stack.add("flask");
    if (/sqlalchemy/i.test(content)) stack.add("sqlalchemy");
  }

  if (manifests["go.mod"]) {
    stack.add("go");
    const content = manifests["go.mod"];
    if (content.includes("gin-gonic")) stack.add("gin");
    if (content.includes("labstack/echo")) stack.add("echo");
    if (content.includes("gofiber")) stack.add("fiber");
  }

  if (manifests["Cargo.toml"]) {
    stack.add("rust");
    const content = manifests["Cargo.toml"];
    if (content.includes("actix")) stack.add("actix");
    if (content.includes("axum")) stack.add("axum");
    if (content.includes("tokio")) stack.add("tokio");
  }

  if (manifests["Gemfile"]) {
    stack.add("ruby");
    if (/rails/i.test(manifests["Gemfile"])) stack.add("rails");
  }

  if (manifests["pom.xml"] || manifests["build.gradle"]) {
    stack.add("java");
    const content = manifests["pom.xml"] ?? manifests["build.gradle"] ?? "";
    if (/spring/i.test(content)) stack.add("spring");
    if (/kotlin/i.test(content)) stack.add("kotlin");
  }

  if (manifests["mix.exs"]) stack.add("elixir");
  if (manifests["Dockerfile"]) stack.add("docker");

  return Array.from(stack);
}

export async function buildRepoContext(owner: string, repo: string, branch?: string): Promise<RepoContext> {
  const repoInfo = await fetchRepoInfo(owner, repo);
  const ref = branch ?? repoInfo.default_branch;

  const fileTree = await fetchRepoTree(owner, repo, ref);

  const filesToFetch = [
    "README.md",
    "readme.md",
    "CLAUDE.md",
    ...MANIFEST_PATHS.filter((p) => fileTree.includes(p)),
  ].slice(0, 18);

  const fetched = await Promise.all(
    filesToFetch.map((path) =>
      fetchFileContent(owner, repo, path).then((content) => ({ path, content }))
    )
  );

  const manifests: Record<string, string> = {};
  let readme: string | null = null;
  let existingClaudeMd: string | null = null;

  for (const { path, content } of fetched) {
    if (!content) continue;
    if (path === "README.md" || path === "readme.md") {
      readme = content.slice(0, 3000);
    } else if (path === "CLAUDE.md") {
      existingClaudeMd = content.slice(0, 2000);
    } else {
      manifests[path] = content.slice(0, 2000);
    }
  }

  const detectedStack = detectStack(manifests);

  return {
    owner,
    repo,
    branch: ref,
    description: repoInfo.description,
    fileTree,
    manifests,
    readme,
    existingClaudeMd,
    detectedStack,
  };
}
