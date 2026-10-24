import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { Project } from "@/types/content";

export function projectRow(project: Project) {
  return {
    slug: project.slug,
    title: project.title,
    category: project.category,
    year: project.year,
    summary: project.summary,
    cover_image: project.coverImage,
    accent: project.accent,
    tags: project.tags,
    tools: project.tools,
    behance_url: project.behanceUrl,
    featured: project.featured,
    status: project.status,
    sort_order: project.sortOrder,
    content_blocks: project.blocks,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const project = (await request.json()) as Project;
  if (!project.title || !project.slug) return NextResponse.json({ error: "A project title is required." }, { status: 400 });
  const { data, error } = await auth.supabase.from("projects").insert(projectRow(project)).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
  revalidatePath("/");
  revalidatePath("/work");
  return NextResponse.json({ project: { ...project, id: data.id } });
}
