"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Asterisk, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "@/components/admin-provider";
import { AvailabilityToggle } from "@/components/availability-toggle";
import { useDialog } from "@/components/dialog";
import { InlineText } from "@/components/inline-text";
import { InteractivePlayground } from "@/components/interactive-playground";
import { Reveal } from "@/components/motion";
import { ProjectCard } from "@/components/project-card";
import { SaveIndicator, type SaveState } from "@/components/save-indicator";
import { SiteFooter } from "@/components/site-footer";
import { StickerArt } from "@/components/sticker-art";
import { StickerTrail } from "@/components/sticker-trail";
import { useDemoProjects, useDemoSite } from "@/components/use-demo-content";
import { saveSite, uploadMedia } from "@/lib/demo-store";
import type { SiteContent } from "@/types/content";

export function Home({ initialSite, initialProjects }: { initialSite: SiteContent; initialProjects: import("@/types/content").Project[] }) {
  const { isEditing, isDemo } = useAdmin();
  const { showAlert } = useDialog();
  const [site, setSite, persistedSite] = useDemoSite(initialSite);
  const [projects] = useDemoProjects(initialProjects);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSaved = useRef(JSON.stringify(initialSite));

  useEffect(() => { lastSaved.current = JSON.stringify(persistedSite); }, [persistedSite]);
  const performSave = useCallback(async (next: SiteContent) => {
    setSaveState("saving");
    try {
      await saveSite(next, isDemo);
      lastSaved.current = JSON.stringify(next);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1600);
    } catch (error) {
      console.error(error);
      setSaveState("error");
    }
  }, [isDemo]);

  useEffect(() => {
    if (!isEditing) return;
    const serialized = JSON.stringify(site);
    if (serialized === lastSaved.current) return;
    setSaveState("unsaved");
    const timer = window.setTimeout(() => void performSave(site), 900);
    return () => window.clearTimeout(timer);
  }, [site, isEditing, performSave]);

  const update = (patch: Partial<SiteContent>) => setSite((current) => ({ ...current, ...patch }));
  const visibleProjects = projects.filter((project) => project.featured && (project.status === "published" || isEditing)).sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 4);

  return (
    <>
      {isEditing ? <SaveIndicator state={saveState} onSave={() => void performSave(site)} /> : null}
      <main id="top" className="home-page">
        <StickerTrail scope="home" />
        <section className="hero section-pad">
          <motion.div className="hero-shape hero-shape-one" animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }} aria-hidden="true">✳</motion.div>
          <motion.div className="hero-shape hero-shape-two" animate={{ y: [0, -12, 0], rotate: [8, 14, 8] }} transition={{ duration: 5, repeat: Infinity }} aria-hidden="true" />
          <div className="hero-copy">
            <motion.div className="hero-eyebrow" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}><span className="eyebrow-line" /><InlineText value={site.role} editing={isEditing} onChange={(role) => update({ role })} label="Professional roles" /></motion.div>
            <h1 className="hero-title">
              <span className="title-mask"><motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}><InlineText value={site.heroTitle} editing={isEditing} onChange={(heroTitle) => update({ heroTitle })} label="Hero title" /></motion.span></span>
              <span className="title-mask"><motion.em initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}><InlineText value={site.heroAccent} editing={isEditing} onChange={(heroAccent) => update({ heroAccent })} label="Hero accent title" /></motion.em></span>
            </h1>
            <motion.div className="hero-intro-wrap" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.65 }}>
              <InlineText as="p" className="hero-intro" value={site.intro} editing={isEditing} onChange={(intro) => update({ intro })} multiline label="Introduction" />
              <div className="hero-actions"><Link href="/work" className="button button-dark" data-cursor="GO">See my work <ArrowDown size={18} /></Link><Link href="/contact" className="text-link">Let’s talk <ArrowUpRight size={17} /></Link></div>
              {isEditing ? <AvailabilityToggle className="hero-availability-toggle" checked={site.showAvailability !== false} onChange={(showAvailability) => update({ showAvailability })} /> : null}
            </motion.div>
          </div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.9, rotate: 4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            <div className="portrait-arch"><img src={site.profileImage} alt="Rashi Chugh, graphic designer and motion artist" fetchPriority="high" /><div className="portrait-grain" /></div>
            <motion.div className="hero-art-sticker" animate={{ rotate: [-10, -4, -10], y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity }} aria-hidden="true"><StickerArt variant="smiley" /></motion.div>
            {site.showAvailability !== false ? <motion.div className="hero-sticker" animate={{ rotate: [8, 4, 8] }} transition={{ duration: 4, repeat: Infinity }}><Sparkles size={23} /><span>OPEN TO<br />FREELANCE</span></motion.div> : null}
            <div className="portrait-note">that’s me! <span>↙</span></div>
            <div className="hero-swatch" aria-hidden="true"><span /><span /><span /></div>
            {isEditing ? <label className="profile-upload" data-no-cursor>Change photo<input type="file" accept="image/*" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setSaveState("saving");
              try { update({ profileImage: await uploadMedia(file, isDemo) }); }
              catch (error) { await showAlert({ title: "Photo upload failed", message: error instanceof Error ? error.message : "Upload failed", danger: true }); }
              finally { setSaveState("idle"); }
            }} /></label> : null}
          </motion.div>
          <motion.a href="#work" className="scroll-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}><span>SCROLL FOR THE GOOD STUFF</span><ArrowDown size={16} /></motion.a>
        </section>

        <div className="marquee" aria-label="Graphic design, branding, motion and video editing"><div className="marquee-track">{[0, 1].map((copy) => <div className="marquee-content" key={copy} aria-hidden={copy === 1}><span>GRAPHIC DESIGN</span><Asterisk /><span>BRAND IDENTITIES</span><Asterisk /><span>MOTION & VIDEO</span><Asterisk /><span>ILLUSTRATION</span><Asterisk /><span>SOCIAL CONTENT</span><Asterisk /></div>)}</div></div>

        <section className="work-section section-pad" id="work">
          <Reveal className="section-heading-row"><div><p className="section-kicker"><span>01</span> SELECTED WORK</p><h2>A few things<br /><em>I’ve made.</em></h2></div><Link href="/work" className="round-link" data-cursor="ALL" aria-label="View all projects"><span>VIEW ALL</span><ArrowUpRight /></Link></Reveal>
          <div className="featured-grid">
            {visibleProjects.map((project, index) => <Reveal key={project.slug} className={`featured-item featured-item-${index % 5}`} delay={(index % 2) * 0.08}><ProjectCard project={project} index={index} featured /></Reveal>)}
          </div>
        </section>
      </main>
      <InteractivePlayground />
      <SiteFooter site={site} editing={isEditing} onUpdate={update} angular />
    </>
  );
}
