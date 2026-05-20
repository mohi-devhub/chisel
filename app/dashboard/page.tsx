import { auth, currentUser } from "@clerk/nextjs/server";
import {
  Calendar,
  Download,
  FileArchive,
  FolderGit2,
  LibraryBig,
  PackageCheck,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { RepoScanner } from "@/components/dashboard/RepoScanner";
import { PublishSkillDialog } from "@/components/marketplace/PublishSkillDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteNav } from "@/components/ui/site-nav";
import { getDashboardData, normalizeTier } from "@/lib/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your Chisel account, generated skills, and marketplace publishing.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [params, clerkUser, dashboard] = await Promise.all([
    searchParams,
    currentUser(),
    getDashboardData(userId),
  ]);

  const accountEmail =
    dashboard.user?.email ??
    clerkUser?.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "Signed in";
  const activeTier = normalizeTier(
    dashboard.user?.tier,
    dashboard.user?.trial_ends_at
  );
  const canPublish = ["pro", "team_owner", "team_member"].includes(
    dashboard.user?.tier ?? ""
  );
  const publishedSkillIds = new Set(
    dashboard.publishedSkills.map((skill) => skill.skill_id)
  );

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <SiteNav
        links={[
          ...(dashboard.workspace ? [{ label: "Workspace", href: "/workspace" }] : []),
          { label: "Pricing", href: "/pricing" },
        ]}
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="py-12">
          {params.payment === "success" ? (
            <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
              Payment received. Your account will update after Dodo Payments confirms the webhook.
            </div>
          ) : null}

          {/* Page header */}
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge
                variant="outline"
                className="mb-3 capitalize border-accent/30 bg-accent/5 text-accent text-xs"
              >
                {activeTier}
              </Badge>
              <h1 className="font-display text-5xl md:text-6xl tracking-tight text-foreground leading-[0.95]">
                Dashboard
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">{accountEmail}</p>
            </div>
            <Button
              asChild
              className="rounded-full bg-foreground text-background hover:opacity-90"
            >
              <Link href="/generate">
                <PackageCheck className="size-4" />
                Generate skill
              </Link>
            </Button>
          </div>

          {/* Repo scanner — primary entry point */}
          <div className="mb-8">
            <RepoScanner />
          </div>

          {/* Metrics */}
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={<FolderGit2 className="size-4" />}
              label="Scans"
              value={dashboard.scans.length}
              accent
            />
            <MetricCard
              icon={<FileArchive className="size-4" />}
              label="Skills"
              value={dashboard.skills.length}
            />
            <MetricCard
              icon={<Calendar className="size-4" />}
              label="Monthly use"
              value={dashboard.user?.monthly_gen_count ?? 0}
            />
            <MetricCard
              icon={<Store className="size-4" />}
              label="Published"
              value={dashboard.publishedSkills.length}
            />
          </div>

          {dashboard.workspace ? (
            <Card className="mb-6 rounded-2xl border-accent/30 bg-accent/5">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base text-foreground">
                    <Users className="size-4 text-accent" />
                    {dashboard.workspace.org_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {dashboard.workspace.member_count} member
                    {dashboard.workspace.member_count === 1 ? "" : "s"} ·{" "}
                    {dashboard.workspace.item_count} item
                    {dashboard.workspace.item_count === 1 ? "" : "s"} ·{" "}
                    <span className="capitalize">{dashboard.workspace.role}</span>
                  </CardDescription>
                </div>
                <Button size="sm" asChild>
                  <Link href="/workspace">Open workspace</Link>
                </Button>
              </CardHeader>
            </Card>
          ) : null}

          {/* Scan history */}
          <Card className="mb-6 rounded-2xl border-border bg-background">
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>
                CLAUDE.md files you&apos;ve generated. Re-download any one anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.scans.length > 0 ? (
                <div className="divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
                  {dashboard.scans.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-sm font-medium font-mono">
                            {scan.repo_owner}/{scan.repo_name}
                          </h2>
                          {scan.branch ? (
                            <Badge variant="outline" className="text-xs">{scan.branch}</Badge>
                          ) : null}
                        </div>
                        {scan.detected_stack.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {scan.detected_stack.slice(0, 6).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-1.5 text-xs text-muted-foreground/60">
                          {formatDate(scan.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={scan.repo_url} target="_blank" rel="noopener noreferrer">
                            View repo
                          </a>
                        </Button>
                        <Button size="sm" asChild>
                          <a href={`/api/dashboard/scans/${scan.id}/download`}>
                            <Download className="size-3.5" />
                            CLAUDE.md
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<FolderGit2 className="size-5" />}
                  title="No scans yet"
                  description="Use the scanner above to generate your first CLAUDE.md."
                />
              )}
            </CardContent>
          </Card>

          {/* Content grid */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* Generation history */}
            <Card className="rounded-2xl border-border bg-background">
              <CardHeader>
                <CardTitle>Generation History</CardTitle>
                <CardDescription>
                  Generated skills are stored privately and can be downloaded again from here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard.skills.length > 0 ? (
                  <div className="divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
                    {dashboard.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-sm font-medium">
                              {skill.name}
                            </h2>
                            <StructureBadges structure={skill.structure} />
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {skill.description}
                          </p>
                          <p className="mt-1.5 text-xs text-muted-foreground/60">
                            {formatDate(skill.created_at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {canPublish && !publishedSkillIds.has(skill.id) ? (
                            <PublishSkillDialog skill={skill} />
                          ) : null}
                          {canPublish && publishedSkillIds.has(skill.id) ? (
                            <Badge variant="secondary" className="text-xs">Published</Badge>
                          ) : null}
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/api/dashboard/skills/${skill.id}/download`}>
                              <Download className="size-3.5" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<LibraryBig className="size-5" />}
                    title="No generated skills yet"
                    description="Create a skill to build your downloadable history."
                    actionHref="/"
                    actionLabel="Generate skill"
                  />
                )}
              </CardContent>
            </Card>

            {/* Marketplace publishing */}
            <Card className="rounded-2xl border-border bg-background">
              <CardHeader>
                <CardTitle>Marketplace Publishing</CardTitle>
                <CardDescription>
                  Pro accounts can track published skills and download counts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canPublish ? (
                  dashboard.publishedSkills.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.publishedSkills.map((skill) => (
                        <div
                          key={skill.id}
                          className="rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="truncate text-sm font-medium">
                                {skill.name}
                              </h2>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {skill.description}
                              </p>
                            </div>
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {skill.download_count} dl
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {skill.category ? (
                              <Badge variant="outline" className="text-xs">{skill.category}</Badge>
                            ) : null}
                            {(skill.tags ?? []).slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground/60">
                            Published {formatDate(skill.published_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Store className="size-5" />}
                      title="Nothing published"
                      description="Published Pro skills and their download counts will appear here."
                    />
                  )
                ) : (
                  <EmptyState
                    icon={<Store className="size-5" />}
                    title="Pro publishing"
                    description="Upgrade to Pro to publish skills and see marketplace download counts."
                    actionHref="/pricing"
                    actionLabel="View plans"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className={[
        "mb-3 flex size-9 items-center justify-center rounded-lg",
        accent ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground",
      ].join(" ")}>
        {icon}
      </div>
      <div className="font-display text-3xl tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StructureBadges({
  structure,
}: {
  structure: {
    has_scripts?: boolean;
    has_references?: boolean;
    has_assets?: boolean;
  } | null;
}) {
  const labels = [
    structure?.has_scripts ? "Scripts" : null,
    structure?.has_references ? "References" : null,
    structure?.has_assets ? "Assets" : null,
  ].filter(Boolean);

  if (labels.length === 0) {
    return <Badge variant="outline" className="text-xs">SKILL.md</Badge>;
  }

  return labels.map((label) => (
    <Badge key={label} variant="outline" className="text-xs">
      {label}
    </Badge>
  ));
}

function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border/50 px-4 py-8 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
        {icon}
      </div>
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Button className="mt-4" variant="outline" size="sm" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
