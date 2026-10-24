"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDemoSite } from "@/components/use-demo-content";
import type { SiteContent } from "@/types/content";

const links = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ site }: { site: SiteContent }) {
  const pathname = usePathname();
  const [currentSite] = useDemoSite(site);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <Link href="/" className="brand" aria-label="Rashi Chugh, home" onClick={() => setOpen(false)}>
        <span className="brand-flower">✳</span>
        <span>RASHI</span>
        <sup>®</sup>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map((link) => (
          <Link key={link.label} href={link.href} className={pathname === link.href ? "active" : ""}>{link.label}</Link>
        ))}
      </nav>
      {currentSite.showAvailability !== false ? (
        <Link className="availability-pill" href="/contact">
          <span className="status-dot" />
          <span>Open to freelance</span>
          <ArrowUpRight size={15} />
        </Link>
      ) : null}
      <button className="mobile-menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
        {open ? <X /> : <Menu />}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.nav
            className="mobile-nav"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -16, clipPath: "inset(0 0 100% 0 round 24px)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0 round 24px)" }}
            exit={{ opacity: 0, y: -12, clipPath: "inset(0 0 100% 0 round 24px)" }}
          >
            <span className="eyebrow">MENU / NAVIGATION</span>
            {links.map((link, index) => (
              <Link key={link.label} href={link.href} onClick={() => setOpen(false)}>
                <span>0{index + 1}</span>{link.label}<ArrowUpRight />
              </Link>
            ))}
            {currentSite.showAvailability !== false ? <p><span className="status-dot" /> {currentSite.availability}</p> : null}
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
