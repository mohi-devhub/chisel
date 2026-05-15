import JSZip from "jszip";

import { createClient } from "@/lib/supabase/server";
import type { Tier } from "@/types";

export const WORKSPACE_BUCKET = "chisel-workspace";
export const TEAM_SEAT_LIMIT = 5;

export type OrgItemType = "skill" | "template";
export type OrgRole = "owner" | "member";

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface OrgMember {
  user_id: string;
  email: string | null;
  role: OrgRole;
  joined_at: string;
}

export interface OrgItem {
  id: string;
  org_id: string;
  type: OrgItemType;
  name: string;
  description: string | null;
  content_path: string;
  pinned: boolean;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
}

export interface OrgMembership {
  org: Organization;
  role: OrgRole;
}

export async function getOrgForUser(userId: string): Promise<OrgMembership | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_members")
    .select(
      "role, organizations:org_id(id, name, owner_id, created_at)"
    )
    .eq("user_id", userId)
    .maybeSingle<{
      role: OrgRole;
      organizations: Organization | Organization[] | null;
    }>();

  if (error) {
    throw new Error(`Could not load org membership: ${error.message}`);
  }
  if (!data || !data.organizations) return null;

  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  if (!org) return null;
  return { org, role: data.role };
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_members")
    .select("user_id, role, joined_at, users:user_id(email)")
    .eq("org_id", orgId)
    .order("joined_at", { ascending: true })
    .returns<
      Array<{
        user_id: string;
        role: OrgRole;
        joined_at: string;
        users: { email: string } | Array<{ email: string }> | null;
      }>
    >();

  if (error) {
    throw new Error(`Could not load org members: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    email: Array.isArray(row.users)
      ? row.users[0]?.email ?? null
      : row.users?.email ?? null,
  }));
}

export async function getOrgItems(orgId: string): Promise<OrgItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_items")
    .select(
      "id, org_id, type, name, description, content_path, pinned, created_by, created_at, users:created_by(email)"
    )
    .eq("org_id", orgId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<
      Array<{
        id: string;
        org_id: string;
        type: OrgItemType;
        name: string;
        description: string | null;
        content_path: string;
        pinned: boolean;
        created_by: string | null;
        created_at: string;
        users: { email: string } | Array<{ email: string }> | null;
      }>
    >();

  if (error) {
    throw new Error(`Could not load workspace items: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    org_id: row.org_id,
    type: row.type,
    name: row.name,
    description: row.description,
    content_path: row.content_path,
    pinned: row.pinned,
    created_by: row.created_by,
    created_at: row.created_at,
    created_by_email: Array.isArray(row.users)
      ? row.users[0]?.email ?? null
      : row.users?.email ?? null,
  }));
}

export async function getOrgItem(orgId: string, itemId: string): Promise<OrgItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_items")
    .select(
      "id, org_id, type, name, description, content_path, pinned, created_by, created_at, users:created_by(email)"
    )
    .eq("org_id", orgId)
    .eq("id", itemId)
    .maybeSingle<{
      id: string;
      org_id: string;
      type: OrgItemType;
      name: string;
      description: string | null;
      content_path: string;
      pinned: boolean;
      created_by: string | null;
      created_at: string;
      users: { email: string } | Array<{ email: string }> | null;
    }>();

  if (error) {
    throw new Error(`Could not load workspace item: ${error.message}`);
  }
  if (!data) return null;
  return {
    id: data.id,
    org_id: data.org_id,
    type: data.type,
    name: data.name,
    description: data.description,
    content_path: data.content_path,
    pinned: data.pinned,
    created_by: data.created_by,
    created_at: data.created_at,
    created_by_email: Array.isArray(data.users)
      ? data.users[0]?.email ?? null
      : data.users?.email ?? null,
  };
}

export async function getOrgItemPreview(item: OrgItem): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(WORKSPACE_BUCKET)
    .download(item.content_path);
  if (error || !data) return null;

  if (item.type === "template") {
    return data.text();
  }

  const zip = await JSZip.loadAsync(await data.arrayBuffer());
  const skillFile = zip.file("SKILL.md");
  return skillFile ? skillFile.async("string") : null;
}

export async function getOrgItemDownloadUrl(item: OrgItem) {
  const supabase = createClient();
  const ext = item.type === "skill" ? "skill" : "md";
  const { data, error } = await supabase.storage
    .from(WORKSPACE_BUCKET)
    .createSignedUrl(item.content_path, 3600, {
      download: `${sanitizeFilename(item.name)}.${ext}`,
    });
  if (error) {
    throw new Error(`Could not create signed download URL: ${error.message}`);
  }
  return data.signedUrl;
}

export type AddItemResult =
  | { status: "added"; itemId: string }
  | { status: "forbidden" }
  | { status: "skill_not_found" };

export interface AddTemplateInput {
  orgId: string;
  userId: string;
  name: string;
  description: string;
  content: string;
}

export interface AddSkillInput {
  orgId: string;
  userId: string;
  skillId: string;
  name: string;
  description: string;
}

export async function addOrgTemplate(input: AddTemplateInput): Promise<AddItemResult> {
  const supabase = createClient();
  const allowed = await ensureMember(input.orgId, input.userId);
  if (!allowed) return { status: "forbidden" };

  const id = crypto.randomUUID();
  const contentPath = `org/${input.orgId}/templates/${id}.md`;

  const { error: uploadError } = await supabase.storage
    .from(WORKSPACE_BUCKET)
    .upload(contentPath, new Blob([input.content], { type: "text/markdown" }), {
      contentType: "text/markdown",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Could not upload template: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase.from("org_items").insert({
    id,
    org_id: input.orgId,
    type: "template",
    name: input.name,
    description: input.description,
    content_path: contentPath,
    created_by: input.userId,
  });

  if (insertError) {
    await supabase.storage.from(WORKSPACE_BUCKET).remove([contentPath]);
    throw new Error(`Could not add template: ${insertError.message}`);
  }

  return { status: "added", itemId: id };
}

export async function addOrgSkill(input: AddSkillInput): Promise<AddItemResult> {
  const supabase = createClient();
  const allowed = await ensureMember(input.orgId, input.userId);
  if (!allowed) return { status: "forbidden" };

  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("storage_path")
    .eq("id", input.skillId)
    .eq("user_id", input.userId)
    .maybeSingle<{ storage_path: string }>();

  if (skillError) {
    throw new Error(`Could not load skill: ${skillError.message}`);
  }
  if (!skill) return { status: "skill_not_found" };

  const { data: archive, error: downloadError } = await supabase.storage
    .from("chisel-skills")
    .download(skill.storage_path);

  if (downloadError || !archive) {
    throw new Error(`Could not read source skill: ${downloadError?.message ?? "missing"}`);
  }

  const id = crypto.randomUUID();
  const contentPath = `org/${input.orgId}/skills/${id}.skill`;

  const { error: uploadError } = await supabase.storage
    .from(WORKSPACE_BUCKET)
    .upload(contentPath, archive, {
      contentType: "application/zip",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Could not upload skill: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase.from("org_items").insert({
    id,
    org_id: input.orgId,
    type: "skill",
    name: input.name,
    description: input.description,
    content_path: contentPath,
    created_by: input.userId,
  });

  if (insertError) {
    await supabase.storage.from(WORKSPACE_BUCKET).remove([contentPath]);
    throw new Error(`Could not add skill: ${insertError.message}`);
  }

  return { status: "added", itemId: id };
}

export async function removeOrgItem(orgId: string, userId: string, itemId: string) {
  const supabase = createClient();
  const allowed = await ensureMember(orgId, userId);
  if (!allowed) return { status: "forbidden" as const };

  const { data: item, error: fetchError } = await supabase
    .from("org_items")
    .select("content_path")
    .eq("org_id", orgId)
    .eq("id", itemId)
    .maybeSingle<{ content_path: string }>();

  if (fetchError) {
    throw new Error(`Could not load item: ${fetchError.message}`);
  }
  if (!item) return { status: "not_found" as const };

  const { error: deleteError } = await supabase
    .from("org_items")
    .delete()
    .eq("org_id", orgId)
    .eq("id", itemId);

  if (deleteError) {
    throw new Error(`Could not remove item: ${deleteError.message}`);
  }

  await supabase.storage.from(WORKSPACE_BUCKET).remove([item.content_path]);
  return { status: "removed" as const };
}

export async function setOrgItemPinned(
  orgId: string,
  userId: string,
  itemId: string,
  pinned: boolean
) {
  const supabase = createClient();
  const allowed = await ensureMember(orgId, userId);
  if (!allowed) return { status: "forbidden" as const };

  const { error } = await supabase
    .from("org_items")
    .update({ pinned })
    .eq("org_id", orgId)
    .eq("id", itemId);

  if (error) {
    throw new Error(`Could not update item: ${error.message}`);
  }
  return { status: "ok" as const };
}

export type InviteResult =
  | { status: "invited"; userId: string }
  | { status: "forbidden" }
  | { status: "user_not_found" }
  | { status: "already_member" }
  | { status: "seat_limit" };

export async function inviteMember(
  orgId: string,
  ownerId: string,
  email: string
): Promise<InviteResult> {
  const supabase = createClient();
  const ownership = await isOrgOwner(orgId, ownerId);
  if (!ownership) return { status: "forbidden" };

  const normalizedEmail = email.trim().toLowerCase();
  const { data: invitee, error: userError } = await supabase
    .from("users")
    .select("id, org_id")
    .ilike("email", normalizedEmail)
    .maybeSingle<{ id: string; org_id: string | null }>();

  if (userError) {
    throw new Error(`Could not look up user: ${userError.message}`);
  }
  if (!invitee) return { status: "user_not_found" };

  if (invitee.org_id === orgId) {
    return { status: "already_member" };
  }
  if (invitee.org_id && invitee.org_id !== orgId) {
    return { status: "already_member" };
  }

  const { count, error: countError } = await supabase
    .from("org_members")
    .select("user_id", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (countError) {
    throw new Error(`Could not count members: ${countError.message}`);
  }
  if ((count ?? 0) >= TEAM_SEAT_LIMIT) {
    return { status: "seat_limit" };
  }

  const { error: insertError } = await supabase
    .from("org_members")
    .insert({ org_id: orgId, user_id: invitee.id, role: "member" });

  if (insertError) {
    throw new Error(`Could not add member: ${insertError.message}`);
  }

  const { error: tierError } = await supabase
    .from("users")
    .update({ tier: "team_member" as Tier, org_id: orgId })
    .eq("id", invitee.id);

  if (tierError) {
    throw new Error(`Could not update invitee tier: ${tierError.message}`);
  }

  return { status: "invited", userId: invitee.id };
}

export type RemoveMemberResult =
  | { status: "removed" }
  | { status: "forbidden" }
  | { status: "cannot_remove_owner" }
  | { status: "not_member" };

export async function removeMember(
  orgId: string,
  ownerId: string,
  targetUserId: string
): Promise<RemoveMemberResult> {
  const supabase = createClient();
  const ownership = await isOrgOwner(orgId, ownerId);
  if (!ownership) return { status: "forbidden" };

  if (targetUserId === ownerId) {
    return { status: "cannot_remove_owner" };
  }

  const { data: membership, error: lookupError } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", targetUserId)
    .maybeSingle<{ role: OrgRole }>();

  if (lookupError) {
    throw new Error(`Could not load membership: ${lookupError.message}`);
  }
  if (!membership) return { status: "not_member" };
  if (membership.role === "owner") return { status: "cannot_remove_owner" };

  const { error: deleteError } = await supabase
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", targetUserId);

  if (deleteError) {
    throw new Error(`Could not remove member: ${deleteError.message}`);
  }

  const { error: tierError } = await supabase
    .from("users")
    .update({ tier: "free" as Tier, org_id: null })
    .eq("id", targetUserId);

  if (tierError) {
    throw new Error(`Could not reset member tier: ${tierError.message}`);
  }

  return { status: "removed" };
}

async function ensureMember(orgId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle<{ user_id: string }>();
  if (error) {
    throw new Error(`Could not verify membership: ${error.message}`);
  }
  return Boolean(data);
}

async function isOrgOwner(orgId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle<{ role: OrgRole }>();
  if (error) {
    throw new Error(`Could not verify ownership: ${error.message}`);
  }
  return data?.role === "owner";
}

function sanitizeFilename(name: string) {
  return (
    name.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").slice(0, 60) ||
    "workspace-item"
  );
}
