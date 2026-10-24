"use client";

import { ArrowUpRight, CalendarDays, Linkedin, Palette } from "lucide-react";
import Link from "next/link";
import type { SiteContent } from "@/types/content";
import { AvailabilityToggle } from "@/components/availability-toggle";
import { InlineText } from "@/components/inline-text";
import { LocalTime } from "@/components/local-time";

export function SiteFooter({ site, editing = false, onUpdate, angular = false }: { site: SiteContent; editing?: boolean; onUpdate?: (patch: Partial<SiteContent>) => void; angular?: boolean }) {
  return (
    <div className={angular ? "footer-shell footer-angular-shell" : "footer-shell"}>
      <footer className={`site-footer ${angular ? "is-angular" : ""}`} id="contact">
        <div className="footer-scribble" aria-hidden="true">✳</div>
        <div className="footer-content">
          <div className="footer-top">
            <p className="section-kicker light"><span>05</span> SAY HELLO</p>
            <h2>Have an idea?<br /><em>Let’s make it fun.</em></h2>
            <p className="footer-intro">A project, a half-formed thought, or a brief you’re excited about — my inbox is open.</p>
            <Link href="/contact" className="footer-meet-link"><CalendarDays size={17} /> Send a message or book a Google Meet <ArrowUpRight size={16} /></Link>
            {editing && onUpdate ? (
              <InlineText as="p" className="footer-email" value={site.email} editing onChange={(email) => onUpdate({ email })} label="Contact email" />
            ) : (
              <a className="footer-email" href={`mailto:${site.email}`} data-cursor="EMAIL">{site.email}<ArrowUpRight /></a>
            )}
          </div>
          <div className="footer-links-row">
            <div className="footer-socials">
              <a href={site.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={18} /> LinkedIn <ArrowUpRight size={16} /></a>
              <a href={site.behanceUrl} target="_blank" rel="noreferrer"><Palette size={18} /> Behance <ArrowUpRight size={16} /></a>
              <Link href={site.resumeUrl} target="_blank">Resume <ArrowUpRight size={16} /></Link>
            </div>
            {editing && onUpdate ? (
              <div className="footer-availability is-editing">
                <AvailabilityToggle checked={site.showAvailability !== false} onChange={(showAvailability) => onUpdate({ showAvailability })} />
                {site.showAvailability !== false ? <span className="footer-availability-copy"><span className="status-dot" /><InlineText value={site.availability} editing onChange={(availability) => onUpdate({ availability })} /></span> : null}
              </div>
            ) : site.showAvailability !== false ? (
              <div className="footer-availability"><span className="status-dot" /><span>{site.availability}</span></div>
            ) : null}
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Rashi Chugh</span>
            <span>Gurugram, India · <LocalTime /></span>
            <Link href="/auth" className="studio-login">Studio login</Link>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
