"use client";

import { ArrowUpRight, CalendarDays, Check, Clock3, Linkedin, Mail, MapPin, Palette, Send, Video } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DatePicker } from "@/components/date-picker";
import { SiteFooter } from "@/components/site-footer";
import { StickerTrail } from "@/components/sticker-trail";
import { ToyboxSticker } from "@/components/toybox-stickers";
import type { SiteContent } from "@/types/content";
import type { BookingSlot } from "@/lib/booking";

type Status = { type: "idle" | "loading" | "success" | "error"; message?: string };

function firstOpenDate() {
  let date = DateTime.now().setZone("Asia/Calcutta").plus({ days: 1 });
  while (date.weekday > 5) date = date.plus({ days: 1 });
  return date.toISODate()!;
}

export function Contact({ site }: { site: SiteContent }) {
  const [mode, setMode] = useState<"message" | "meet">("message");
  const [messageStatus, setMessageStatus] = useState<Status>({ type: "idle" });
  const [bookingStatus, setBookingStatus] = useState<Status>({ type: "idle" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(firstOpenDate);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [meetResult, setMeetResult] = useState<{ meetLink: string; calendarLink?: string; slot: BookingSlot } | null>(null);
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Calcutta", []);
  const minDate = useMemo(() => DateTime.now().setZone("Asia/Calcutta").toISODate()!, []);
  const maxDate = useMemo(() => DateTime.now().setZone("Asia/Calcutta").plus({ days: 60 }).toISODate()!, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/contact/slots?date=${encodeURIComponent(date)}&timeZone=${encodeURIComponent(timeZone)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { slots?: BookingSlot[]; configured?: boolean; error?: string };
        if (!response.ok) throw new Error(data.error || "Availability could not be loaded.");
        setSlots(data.slots ?? []);
        setConfigured(Boolean(data.configured));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSlots([]);
        setSlotsError(error instanceof Error ? error.message : "Availability could not be loaded.");
      })
      .finally(() => { if (!controller.signal.aborted) setSlotsLoading(false); });
    return () => controller.abort();
  }, [date, timeZone]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setMessageStatus({ type: "loading" });
    try {
      const response = await fetch("/api/contact/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Message could not be sent.");
      form.reset();
      setMessageStatus({ type: "success", message: `Thanks — your note is on its way to Rashi. A confirmation was also sent to ${values.email}.` });
    } catch (error) {
      setMessageStatus({ type: "error", message: error instanceof Error ? error.message : "Message could not be sent." });
    }
  };

  const bookMeet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSlot) return;
    setBookingStatus({ type: "loading" });
    setMeetResult(null);
    try {
      const response = await fetch("/api/contact/meet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, notes, start: selectedSlot.start, end: selectedSlot.end, website: new FormData(event.currentTarget).get("website") }) });
      const data = await response.json() as { error?: string; meetLink?: string; calendarLink?: string };
      if (!response.ok) throw new Error(data.error || "The Meet could not be booked.");
      setMeetResult({ meetLink: data.meetLink!, calendarLink: data.calendarLink, slot: selectedSlot });
      setBookingStatus({ type: "success", message: "Your Meet is booked. Google Calendar invitations have been sent to you and Rashi." });
      setSlots((current) => current.filter((slot) => slot.start !== selectedSlot.start));
      setSelectedSlot(null);
    } catch (error) {
      setBookingStatus({ type: "error", message: error instanceof Error ? error.message : "The Meet could not be booked." });
    }
  };

  return (
    <>
      <main className="contact-page-main" id="top">
        <StickerTrail scope="contact" />
        <section className="contact-hero section-pad">
          <div className="contact-hero-copy">
            <p className="section-kicker"><span>✳</span> SAY HELLO</p>
            <h1>A project, a thought,<br /><em>or a tiny spark?</em></h1>
            <p>Tell Rashi what you’re making, or grab a relaxed 30-minute Google Meet to talk it through.</p>
            <div className="contact-direct-links">
              <a href={`mailto:${site.email}`}><Mail size={17} />{site.email}<ArrowUpRight size={15} /></a>
              <span><MapPin size={16} />{site.location} · working everywhere</span>
            </div>
          </div>
          <div className="contact-hero-art" aria-hidden="true"><ToyboxSticker id="hello" /><ToyboxSticker id="sun" /><span>GOOD IDEAS<br />WELCOME HERE</span></div>
        </section>

        <section className="contact-content section-pad">
          <div className="contact-form-shell">
            <div className="contact-mode-tabs" role="tablist" aria-label="Contact options">
              <button type="button" role="tab" aria-selected={mode === "message"} className={mode === "message" ? "active" : ""} onClick={() => setMode("message")}><Mail size={16} /> Send a message</button>
              <button type="button" role="tab" aria-selected={mode === "meet"} className={mode === "meet" ? "active" : ""} onClick={() => setMode("meet")}><Video size={17} /> Book a Google Meet</button>
            </div>

            {mode === "message" ? (
              <form className="contact-form" onSubmit={sendMessage}>
                <div className="contact-form-heading"><span>01 / PROJECT ENQUIRY</span><h2>What’s on your mind?</h2><p>A few details are perfect. Rashi will reply to your email.</p></div>
                <div className="contact-field-row">
                  <label><span>Your name</span><input name="name" type="text" autoComplete="name" required minLength={2} maxLength={80} placeholder="Your name" /></label>
                  <label><span>Email address</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@gmail.com" /></label>
                </div>
                <label><span>What kind of project?</span><select name="projectType" defaultValue="Brand identity"><option>Brand identity</option><option>Graphic design</option><option>Illustration</option><option>Motion graphics</option><option>Video editing</option><option>Something fun</option></select></label>
                <label><span>Tell me a little about it</span><textarea name="message" required minLength={10} maxLength={3500} rows={6} placeholder="The idea, the timeline, the vibe — whatever you have so far." /></label>
                <label className="contact-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                <div className="contact-submit-row"><button type="submit" className="contact-submit" disabled={messageStatus.type === "loading"}>{messageStatus.type === "loading" ? "Sending…" : "Send to Rashi"}<Send size={17} /></button><span>Your email is only used to reply to this enquiry.</span></div>
                <p className={`contact-status ${messageStatus.type}`} aria-live="polite">{messageStatus.message}</p>
              </form>
            ) : (
              <form className="contact-form" onSubmit={bookMeet}>
                <div className="contact-form-heading"><span>02 / GOOGLE MEET</span><h2>Pick a time. Meet Rashi.</h2><p>Thirty minutes, camera optional. Times are shown in <strong>{timeZone.replace(/_/g, " ")}</strong>.</p></div>
                <div className="contact-field-row">
                  <label><span>Your name</span><input type="text" autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
                  <label><span>Gmail / email address</span><input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@gmail.com" /></label>
                </div>
                <div className="contact-date-field"><span>Choose a date <small>Rashi’s calendar · weekdays</small></span><DatePicker value={date} minDate={minDate} maxDate={maxDate} onChange={(nextDate) => { setSlotsLoading(true); setSlotsError(""); setSelectedSlot(null); setDate(nextDate); }} /></div>
                <div className="contact-slot-field"><span>Available times <small>30-minute slots</small></span>{slotsLoading ? <div className="contact-slots-loading">Checking Rashi’s calendar…</div> : slotsError ? <p className="contact-status error">{slotsError}</p> : slots.length ? <div className="contact-slots">{slots.map((slot) => <button key={slot.start} type="button" className={selectedSlot?.start === slot.start ? "active" : ""} onClick={() => setSelectedSlot(slot)} aria-pressed={selectedSlot?.start === slot.start}><Clock3 size={13} />{slot.timeLabel}{selectedSlot?.start === slot.start ? <Check size={13} /> : null}</button>)}</div> : <div className="contact-no-slots">No open slots on this date. Try another weekday.</div>}</div>
                <label><span>Anything Rashi should know? <small>Optional</small></span><textarea rows={3} maxLength={1800} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="A link, a project thought, or just what you’d like to discuss." /></label>
                <label className="contact-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                {configured === false ? <p className="contact-integration-note">Google booking is not connected. These times are a rule-based preview, not live availability. Please email Rashi directly to book.</p> : null}
                <div className="contact-submit-row"><button type="submit" className="contact-submit" disabled={!selectedSlot || bookingStatus.type === "loading" || configured === false}><CalendarDays size={17} />{bookingStatus.type === "loading" ? "Booking your Meet…" : "Schedule Google Meet"}</button><span>Google sends the invitation and Meet link to both emails.</span></div>
                <p className={`contact-status ${bookingStatus.type}`} aria-live="polite">{bookingStatus.message}</p>
                {meetResult ? <div className="contact-meet-success"><Check size={20} /><div><strong>You’re on Rashi’s calendar.</strong><span>{meetResult.slot.label} · {timeZone.replace(/_/g, " ")}</span></div><a href={meetResult.meetLink} target="_blank" rel="noreferrer">Open Meet <ArrowUpRight size={15} /></a></div> : null}
              </form>
            )}
          </div>

          <aside className="contact-aside">
            <span className="contact-aside-kicker">OTHER GOOD PLACES</span>
            <h3>Prefer a slower hello?</h3>
            <p>Email works. So does a Behance message or a LinkedIn connection. No perfectly polished brief required.</p>
            <a href={site.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={18} /><span>LinkedIn<small>Connect with Rashi</small></span><ArrowUpRight size={16} /></a>
            <a href={site.behanceUrl} target="_blank" rel="noreferrer"><Palette size={18} /><span>Behance<small>See the visual archive</small></span><ArrowUpRight size={16} /></a>
            <div className="contact-aside-note"><ToyboxSticker id="wink" /><span>Rashi’s inbox is open for<br /><strong>good ideas and new projects.</strong></span></div>
          </aside>
        </section>
      </main>
      <SiteFooter site={site} />
    </>
  );
}
