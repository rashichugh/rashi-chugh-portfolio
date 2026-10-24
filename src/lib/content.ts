import "server-only";
import { defaultProjects, defaultSite } from "@/lib/default-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Project, SiteContent } from "@/types/content";

function contentClient() {
  if (!hasSupabaseEnv()) return null;
  try {
    return createSupabaseAdminClient();
  } catch (error) {
    console.error("[content] Supabase unavailable; using local seed content.", error);
    return null;
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  const supabase = contentClient();
  if (!supabase) return defaultSite;
  const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (error || !data?.data) {
    if (error) console.error("[content] site_settings", error.message);
    return defaultSite;
  }
  return { ...defaultSite, ...(data.data as Partial<SiteContent>) };
}

function mapProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? "Untitled"),
    category: String(row.category ?? "Graphic Design"),
    year: String(row.year ?? ""),
    summary: String(row.summary ?? ""),
    coverImage: String(row.cover_image ?? ""),
    accent: String(row.accent ?? "#DDF48B"),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    tools: Array.isArray(row.tools) ? row.tools.map(String) : [],
    behanceUrl: String(row.behance_url ?? ""),
    featured: Boolean(row.featured),
    status: row.status === "draft" ? "draft" : "published",
    sortOrder: Number(row.sort_order ?? 0),
    blocks: Array.isArray(row.content_blocks) ? (row.content_blocks as Project["blocks"]) : [],
  };
}

export async function getProjects(includeDrafts = false): Promise<Project[]> {
  const supabase = contentClient();
  if (!supabase) return includeDrafts ? defaultProjects : defaultProjects.filter((p) => p.status === "published");
  let query = supabase.from("projects").select("*").order("sort_order").order("created_at");
  if (!includeDrafts) query = query.eq("status", "published");
  const { data, error } = await query;
  if (error) {
    console.error("[content] projects", error.message);
    return defaultProjects;
  }
  return (data ?? []).map((row) => mapProject(row as Record<string, unknown>));
}

export async function getProject(slug: string, includeDraft = false): Promise<Project | null> {
  const supabase = contentClient();
  if (!supabase) {
    return defaultProjects.find((project) => project.slug === slug && (includeDraft || project.status === "published")) ?? null;
  }
  let query = supabase.from("projects").select("*").eq("slug", slug);
  if (!includeDraft) query = query.eq("status", "published");
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return mapProject(data as Record<string, unknown>);
}
