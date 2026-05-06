import { auth, currentUser } from "@clerk/nextjs/server";
import {
  Calendar,
  CreditCard,
  Download,
  FileArchive,
  LibraryBig,
  PackageCheck,
  Store,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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
import { getDashboardData, normalizeTier } from "@/lib/dashboard";

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
  const isPro = dashboard.user?.tier === "pro";
  const publishedSkillIds = new Set(
    dashboard.publishedSkills.map((skill) => skill.skill_id)
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b pb-4">
          <Link href="/" className="text-lg font-semibold">
            Chisel
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
          </nav>
        </header>

        <section className="py-8">
          {params.payment === "success" ? (
            <div className="mb-5 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Payment received. Your account will update after Razorpay confirms
              the webhook.
            </div>
          ) : null}

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="outline" className="mb-3 capitalize">
                {activeTier}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                {accountEmail}
              </p>
            </div>
            <Button asChild>
              <Link href="/">
                <PackageCheck className="size-4" />
                Generate skill
              </Link>
            </Button>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={<FileArchive className="size-4" />}
              label="Generated"
              value={dashboard.skills.length}
            />
            <MetricCard
              icon={<Calendar className="size-4" />}
              label="Monthly use"
              value={dashboard.user?.monthly_gen_count ?? 0}
            />
            <MetricCard
              icon={<CreditCard className="size-4" />}
              label="Credits"
              value={dashboard.user?.credits ?? 0}
            />
            <MetricCard
              icon={<Store className="size-4" />}
              label="Published"
              value={dashboard.publishedSkills.length}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Generation History</CardTitle>
                <CardDescription>
                  Generated skills are stored privately and can be downloaded
                  again from here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard.skills.length > 0 ? (
                  <div className="divide-y rounded-md border">
                    {dashboard.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-sm font-medium">
                              {skill.name}
                            </h2>
                            <StructureBadges structure={skill.structure} />
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {skill.description}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDate(skill.created_at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {isPro && !publishedSkillIds.has(skill.id) ? (
                            <PublishSkillDialog skill={skill} />
                          ) : null}
                          {isPro && publishedSkillIds.has(skill.id) ? (
                            <Badge variant="secondary">Published</Badge>
                          ) : null}
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/api/dashboard/skills/${skill.id}/download`}>
                              <Download className="size-4" />
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

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Marketplace Publishing</CardTitle>
                <CardDescription>
                  Pro accounts can track published skills and download counts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isPro ? (
                  dashboard.publishedSkills.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.publishedSkills.map((skill) => (
                        <div key={skill.id} className="rounded-md border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="truncate text-sm font-medium">
                                {skill.name}
                              </h2>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {skill.description}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {skill.download_count} downloads
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {skill.category ? (
                              <Badge variant="outline">{skill.category}</Badge>
                            ) : null}
                            {(skill.tags ?? []).slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
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
    return <Badge variant="outline">SKILL.md</Badge>;
  }

  return labels.map((label) => (
    <Badge key={label} variant="outline">
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
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed px-4 py-8 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
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
