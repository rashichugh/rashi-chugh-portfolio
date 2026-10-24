import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import type { SiteContent } from "@/types/content";

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const site = (await request.json()) as SiteContent;
  if (!site.name || !site.email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  const { error } = await auth.supabase.from("site_settings").upsert({ id: 1, data: site, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
