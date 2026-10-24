import { cleanText, contactRateLimit, jsonError, validEmail } from "@/lib/contact-security";
import { hasGoogleIntegration, sendContactEmails } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!contactRateLimit(request, "message", 5)) return jsonError("Too many messages from this connection. Please try again in a few minutes.", 429);
  if (!hasGoogleIntegration()) return jsonError("Direct message delivery is not configured yet. Please email Rashi using the address on this page.", 503);
  try {
    const body = await request.json() as Record<string, unknown>;
    if (cleanText(body.website, 100)) return Response.json({ ok: true });
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254);
    const projectType = cleanText(body.projectType, 80) || "Something fun";
    const message = cleanText(body.message, 3500);
    if (name.length < 2 || !validEmail(email) || message.length < 10) return jsonError("Please add your name, a valid email, and a message of at least 10 characters.", 400);
    await sendContactEmails({ name, email, projectType, message });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[contact] message", error);
    return jsonError("Your message could not be sent right now. Please email Rashi directly.", 502);
  }
}
