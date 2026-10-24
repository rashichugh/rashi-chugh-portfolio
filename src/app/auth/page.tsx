import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getAdminContext } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio login", robots: { index: false, follow: false } };

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const admin = await getAdminContext();
  const { next } = await searchParams;
  if (admin.isAdmin) redirect(next?.startsWith("/") ? next : "/");
  return (
    <main className="auth-page section-pad" id="top">
      <div className="auth-art" aria-hidden="true"><span>✳</span><span>✦</span><span>●</span></div>
      <section>
        <Link href="/" className="back-link">← Back to portfolio</Link>
        <p className="section-kicker"><span>✳</span> RASHI STUDIO</p>
        <h1>Make good stuff.<br /><em>Keep it fresh.</em></h1>
        <p>Sign in to edit the portfolio inline, build project stories and publish new work.</p>
        {admin.authEnabled ? <AuthForm next={next?.startsWith("/") ? next : "/"} /> : <p className="auth-note">Admin sign-in is not configured for this deployment. Connect Supabase to enable secure magic-link access.</p>}
        {admin.email ? <p className="auth-note">Your signed-in account ({admin.email}) is not on the admin allowlist.</p> : null}
      </section>
    </main>
  );
}
