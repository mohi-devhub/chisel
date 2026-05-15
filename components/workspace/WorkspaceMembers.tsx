"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrgMember } from "@/lib/workspace";

export function WorkspaceMembers({
  members,
  isOwner,
  currentUserId,
  seatLimit,
}: {
  members: OrgMember[];
  isOwner: boolean;
  currentUserId: string;
  seatLimit: number;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const seatsLeft = Math.max(0, seatLimit - members.length);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message ?? "Could not invite member.");
        return;
      }
      setEmail("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId: string) {
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(
        `/api/workspace/members?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message ?? "Could not remove member.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Members</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {members.length} of {seatLimit} seats used
          </p>
        </div>
      </div>

      <ul className="mb-4 divide-y divide-border/50 overflow-hidden rounded-lg border border-border/50">
        {members.map((member) => (
          <li
            key={member.user_id}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm">
                  {member.email ?? member.user_id}
                </span>
                <Badge variant={member.role === "owner" ? "default" : "outline"} className="text-xs capitalize">
                  {member.role}
                </Badge>
                {member.user_id === currentUserId ? (
                  <Badge variant="secondary" className="text-xs">You</Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                Joined {formatDate(member.joined_at)}
              </p>
            </div>
            {isOwner && member.role !== "owner" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(member.user_id)}
                disabled={busy}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {isOwner ? (
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy || seatsLeft === 0}
            required
          />
          <Button type="submit" disabled={busy || seatsLeft === 0}>
            <UserPlus className="size-4" />
            Invite
          </Button>
        </form>
      ) : null}

      {seatsLeft === 0 && isOwner ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Seat limit reached. Remove a member to invite someone new.
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}
