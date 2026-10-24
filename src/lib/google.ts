import "server-only";
import { DateTime } from "luxon";
import type { BusyInterval } from "@/lib/booking";

const rashiEmail = process.env.RASHI_CONTACT_EMAIL || "rashichugh610@gmail.com";

export function hasGoogleIntegration() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

export async function getGoogleAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const data = await response.json() as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || "Google OAuth token refresh failed.");
  return data.access_token;
}

async function googleApi<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://www.googleapis.com/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `Google API request failed (${response.status}).`);
  return data;
}

export async function getBusyIntervals(timeMin: string, timeMax: string): Promise<BusyInterval[]> {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const data = await googleApi<{ calendars?: Record<string, { busy?: BusyInterval[] }> }>("calendar/v3/freeBusy", accessToken, {
    method: "POST",
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] }),
  });
  return data.calendars?.[calendarId]?.busy ?? [];
}

export async function createGoogleMeet({ name, email, notes, start, end }: { name: string; email: string; notes: string; start: string; end: string }) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const event = await googleApi<{ id: string; hangoutLink?: string; htmlLink?: string }>(`calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      summary: `Portfolio chat · ${name} × Rashi`,
      description: `A Google Meet booked through Rashi Chugh’s portfolio.\n\nGuest: ${name} (${email})\n\nProject notes:\n${notes || "No notes supplied."}`,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: [{ email, displayName: name }, { email: rashiEmail, displayName: "Rashi Chugh" }],
      conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
      reminders: { useDefault: false, overrides: [{ method: "email", minutes: 60 }, { method: "popup", minutes: 10 }] },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
    }),
  });
  if (!event.hangoutLink) throw new Error("The event was created without a Google Meet link. Check Meet permissions for this Google account.");

  const startLabel = DateTime.fromISO(start).setZone(process.env.BOOKING_TIME_ZONE || "Asia/Calcutta").toFormat("cccc, d LLLL yyyy · h:mm a ZZZZ");
  try {
    await sendGmail(accessToken, {
      to: rashiEmail,
      subject: `New portfolio Meet · ${name}`,
      replyTo: email,
      text: `You have a new portfolio Google Meet.\n\nGuest: ${name} (${email})\nWhen: ${startLabel}\nMeet: ${event.hangoutLink}\nCalendar: ${event.htmlLink || "Open Google Calendar"}\n\nNotes:\n${notes || "No notes supplied."}`,
    });
  } catch (error) {
    console.error("[contact] Rashi email copy failed after event creation", error);
  }
  return event;
}

function encodeSubject(subject: string) {
  return `=?UTF-8?B?${Buffer.from(subject.replace(/[\r\n]+/g, " "), "utf8").toString("base64")}?=`;
}

export async function sendGmail(accessToken: string, { to, subject, text, replyTo }: { to: string; subject: string; text: string; replyTo?: string }) {
  const lines = [
    `From: Rashi Chugh <${rashiEmail}>`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
  ];
  if (replyTo) lines.push(`Reply-To: ${replyTo}`);
  lines.push("", text);
  const raw = Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
  return googleApi<{ id: string }>("gmail/v1/users/me/messages/send", accessToken, { method: "POST", body: JSON.stringify({ raw }) });
}

export async function sendContactEmails({ name, email, projectType, message }: { name: string; email: string; projectType: string; message: string }) {
  const accessToken = await getGoogleAccessToken();
  const text = `New portfolio enquiry\n\nName: ${name}\nEmail: ${email}\nProject type: ${projectType}\n\n${message}`;
  await sendGmail(accessToken, { to: rashiEmail, subject: `Portfolio enquiry · ${name}`, replyTo: email, text });
  await sendGmail(accessToken, {
    to: email,
    subject: "Rashi got your message ✦",
    replyTo: rashiEmail,
    text: `Hi ${name},\n\nThanks for reaching out to Rashi Chugh. Your message is in her inbox now, and she’ll get back to you as soon as she can.\n\nYour message:\n${message}\n\nYou can also connect on Behance: https://www.behance.net/rashichugh`,
  });
}
