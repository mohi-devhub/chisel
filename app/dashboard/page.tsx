import { auth, currentUser } from "@clerk/nextjs/server";
import {
  Calendar,
  CreditCard,
  Download,
  FileArchive,
  LibraryBig,
  PackageCheck,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

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
  const canPublish = ["solo", "team_owner", "team_member"].includes(
    dashboard.user?.tier ?? ""
  );
  const publishedSkillIds = new Set(
    dashboard.publishedSkills.map((skill) => skill.skill_id)
  );

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 right-0 h-[500px] w-[700px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <SiteNav
          links={[
            { label: "Registry", href: "/registry" },
            ...(dashboard.workspace ? [{ label: "Workspace", href: "/workspace" }] : []),
            { label: "Pricing", href: "/pricing" },
          ]}
        />

        <section className="py-8">
          {params.payment === "success" ? (
            <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary/80">
              Payment received. Your account will update after Dodo Payments confirms the webhook.
            </div>
          ) : null}

          {/* Page header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge
                variant="outline"
                className="mb-3 capitalize border-primary/30 bg-primary/5 text-primary text-xs"
              >
                {activeTier}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">{accountEmail}</p>
            </div>
            <Button
              asChild
              className="shadow-[0_0_20px_theme(colors.primary/20%)] hover:shadow-[0_0_28px_theme(colors.primary/35%)] transition-shadow"
            >
              <Link href="/generate">
                <PackageCheck className="size-4" />
                Generate skill
              </Link>
            </Button>
          </div>

          {/* Metrics */}
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={<FileArchive className="size-4" />}
              label="Generated"
              value={dashboard.skills.length}
              accent
            />
            <MetricCard
              icon={<Calendar className="size-4" />}
              label="Monthly use"
              value={dashboard.user?.monthly_gen_count ?? 0}
            />
            <MetricCard
              icon={<CreditCard className="size-4" />}
              label="Monthly gens"
              value={dashboard.user?.monthly_gen_count ?? 0}
            />
            <MetricCard
              icon={<Store className="size-4" />}
              label="Published"
              value={dashboard.publishedSkills.length}
            />
          </div>

          {dashboard.workspace ? (
            <Card className="mb-6 rounded-xl border-primary/30 bg-primary/5">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="size-4" />
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

          {/* Content grid */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            {/* Generation history */}
            <Card className="rounded-xl border-border/60 bg-card/80">
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
            <Card className="rounded-xl border-border/60 bg-card/80">
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
    <div className="rounded-xl border border-border/60 bg-card/80 p-4">
      <div className={[
        "mb-3 flex size-9 items-center justify-center rounded-lg",
        accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      ].join(" ")}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
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
