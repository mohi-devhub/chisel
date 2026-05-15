import { auth } from "@clerk/nextjs/server";
import { Hammer, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddItemDialog, type SkillOption } from "@/components/workspace/AddItemDialog";
import { WorkspaceItems } from "@/components/workspace/WorkspaceItems";
import { WorkspaceMembers } from "@/components/workspace/WorkspaceMembers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  TEAM_SEAT_LIMIT,
  getOrgForUser,
  getOrgItems,
  getOrgMembers,
} from "@/lib/workspace";

export const metadata = {
  title: "Workspace — Chisel",
  description: "Private CLAUDE.md templates and skills shared with your team.",
};

export default async function WorkspacePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const membership = await getOrgForUser(userId);
  if (!membership) {
    return <NoOrgState />;
  }

  const [items, members, skills] = await Promise.all([
    getOrgItems(membership.org.id),
    getOrgMembers(membership.org.id),
    getUserSkillOptions(userId),
  ]);

  const isOwner = membership.role === "owner";

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-0 h-[500px] w-[700px] rounded-full bg-primary/4 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-border/60 pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_theme(colors.primary/40%)]">
              <Hammer className="size-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">Chisel</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/registry">Registry</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
          </nav>
        </header>

        <section className="py-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="outline" className="mb-3 capitalize text-xs">
                {membership.role}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {membership.org.name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Private templates and skills shared with your team.
              </p>
            </div>
            <AddItemDialog skills={skills} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <WorkspaceItems items={items} />
            </div>
            <WorkspaceMembers
              members={members}
              isOwner={isOwner}
              currentUserId={userId}
              seatLimit={TEAM_SEAT_LIMIT}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function NoOrgState() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Users className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold">Workspace is a Team plan feature</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Upgrade to Team to create a shared workspace and invite up to {TEAM_SEAT_LIMIT}{" "}
          teammates.
        </p>
        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link href="/pricing">View plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

async function getUserSkillOptions(userId: string): Promise<SkillOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("skills")
    .select("id, name, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<SkillOption[]>();
  return data ?? [];
}
