"use client";

import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm({ next = "/" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) throw error;
      setState("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send sign-in link");
      setState("error");
    }
  }

  if (state === "sent") {
    return <div className="auth-success"><span><Check /></span><h2>Check your inbox.</h2><p>We sent a magic sign-in link to <strong>{email}</strong>. You can close this tab after opening it.</p></div>;
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="email">Admin email</label>
      <div><Mail size={18} /><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
      <button className="button button-lime" disabled={state === "loading"}>{state === "loading" ? <LoaderCircle className="spin" size={18} /> : null} Send magic link <ArrowRight size={18} /></button>
      {message ? <p className="field-error">{message}</p> : null}
      <p>No password needed. Only emails on the admin allowlist can edit.</p>
    </form>
  );
}
