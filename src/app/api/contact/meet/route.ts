import { DateTime } from "luxon";
import { slotIsStillAvailable } from "@/lib/booking";
import { cleanText, contactRateLimit, jsonError, validEmail } from "@/lib/contact-security";
import { createGoogleMeet, getBusyIntervals, hasGoogleIntegration } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!contactRateLimit(request, "meet", 5)) return jsonError("Too many booking attempts. Please try again in a few minutes.", 429);
  if (!hasGoogleIntegration()) return jsonError("Live Google Meet booking is not configured yet. Please email Rashi directly using the address on this page.", 503);
  try {
    const body = await request.json() as Record<string, unknown>;
    if (cleanText(body.website, 100)) return Response.json({ ok: true });
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 254);
    const notes = cleanText(body.notes, 1800);
    const start = cleanText(body.start, 40);
    const end = cleanText(body.end, 40);
    if (name.length < 2 || !validEmail(email) || !DateTime.fromISO(start).isValid || !DateTime.fromISO(end).isValid) return jsonError("Please provide your name, a valid email, and a valid time slot.", 400);
    const busy = await getBusyIntervals(DateTime.fromISO(start).minus({ minutes: 1 }).toISO()!, DateTime.fromISO(end).plus({ minutes: 1 }).toISO()!);
    if (!slotIsStillAvailable(start, end, busy)) return jsonError("That slot was just taken or is no longer available. Please choose another time.", 409);
    const event = await createGoogleMeet({ name, email, notes, start, end });
    return Response.json({ ok: true, id: event.id, meetLink: event.hangoutLink, calendarLink: event.htmlLink, start, end }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[contact] meet booking", error);
    return jsonError("The Meet could not be booked. Please try another slot or contact Rashi directly.", 502);
  }
}
