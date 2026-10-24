import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { AdminContext } from "@/types/content";

export async function getAdminContext(): Promise<AdminContext> {
  if (!hasSupabaseEnv()) {
    const demoEnabled = process.env.NODE_ENV === "development" || process.env.STUDIO_DEMO_MODE === "true";
    if (demoEnabled) return { isAdmin: true, isDemo: true, authEnabled: false, email: "Local studio" };
    return { isAdmin: false, isDemo: false, authEnabled: false, email: null };
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { isAdmin: false, isDemo: false, authEnabled: true, email: null };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { isAdmin: false, isDemo: false, authEnabled: true, email: null };
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("allowed_admins")
      .select("email")
      .eq("email", user.email.toLowerCase())
      .eq("active", true)
      .maybeSingle();
    return { isAdmin: Boolean(data), isDemo: false, authEnabled: true, email: user.email };
  } catch (error) {
    console.error("[auth] Unable to resolve admin", error);
    return { isAdmin: false, isDemo: false, authEnabled: true, email: null };
  }
}

export async function requireAdmin() {
  const context = await getAdminContext();
  if (context.isDemo) {
    return { ok: false as const, response: NextResponse.json({ error: "Demo edits are saved in this browser." }, { status: 409 }) };
  }
  if (!context.isAdmin) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const, supabase: createSupabaseAdminClient() };
}
