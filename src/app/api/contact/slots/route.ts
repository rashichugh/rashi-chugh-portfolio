import { DateTime } from "luxon";
import { bookingSettings, generateBookingSlots } from "@/lib/booking";
import { contactRateLimit, jsonError } from "@/lib/contact-security";
import { getBusyIntervals, hasGoogleIntegration } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!contactRateLimit(request, "slots", 40)) return jsonError("Too many availability requests. Please try again shortly.", 429);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  const timeZone = url.searchParams.get("timeZone") || "Asia/Calcutta";
  const settings = bookingSettings();
  const hostDate = DateTime.fromISO(date, { zone: settings.hostZone });
  if (!hostDate.isValid || hostDate.toISODate() !== date) return jsonError("Choose a valid date.", 400);
  try {
    const busy = hasGoogleIntegration() ? await getBusyIntervals(hostDate.startOf("day").toUTC().toISO()!, hostDate.endOf("day").toUTC().toISO()!) : [];
    return Response.json({ slots: generateBookingSlots(date, timeZone, busy), configured: hasGoogleIntegration(), hostZone: settings.hostZone, duration: settings.duration }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[contact] availability", error);
    return jsonError("Availability could not be checked right now. Please try again or email Rashi directly.", 502);
  }
}
