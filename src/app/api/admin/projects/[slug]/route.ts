import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { projectRow } from "../route";
import type { Project } from "@/types/content";

type Context = { params: Promise<{ slug: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { slug } = await context.params;
  const project = (await request.json()) as Project;
  if (!project.title || !project.slug) return NextResponse.json({ error: "A project title is required." }, { status: 400 });
  const { error } = await auth.supabase.from("projects").update(projectRow(project)).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath(`/work/${slug}`);
  revalidatePath(`/work/${project.slug}`);
  return NextResponse.json({ project });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { slug } = await context.params;
  const { error } = await auth.supabase.from("projects").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath(`/work/${slug}`);
  return NextResponse.json({ ok: true });
}
