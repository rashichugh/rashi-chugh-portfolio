"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Plus } from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/components/admin-provider";
import { ProjectCard } from "@/components/project-card";
import { SiteFooter } from "@/components/site-footer";
import { useDemoProjects, useDemoSite } from "@/components/use-demo-content";
import type { Project, SiteContent } from "@/types/content";

export function WorkArchive({ initialProjects, initialSite }: { initialProjects: Project[]; initialSite: SiteContent }) {
  const { isEditing } = useAdmin();
  const [projects] = useDemoProjects(initialProjects);
  const [site] = useDemoSite(initialSite);
  const [filter, setFilter] = useState("All");
  const visible = projects.filter((project) => project.status === "published" || isEditing);
  const categories = useMemo(() => ["All", ...Array.from(new Set(visible.map((project) => project.category)))], [visible]);
  const filtered = filter === "All" ? visible : visible.filter((project) => project.category === filter);

  return (
    <>
      <main className="work-page section-pad" id="top">
        <section className="work-hero">
          <p className="section-kicker"><span>✳</span> THE WORK ARCHIVE</p>
          <h1>All the fun stuff.<br /><em>In one place.</em></h1>
          <div className="work-hero-bottom">
            <p>Identities, illustrations, social creatives, posters and things that move. Made with curiosity and a healthy dislike for boring.</p>
            <a href="#project-grid" className="circle-down" aria-label="Jump to projects"><ArrowDown /></a>
          </div>
        </section>
        <section id="project-grid" className="work-list-section">
          <div className="work-filter-row">
            <div className="filter-chips" role="group" aria-label="Filter projects">
              {categories.map((category) => (
                <button key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>
                  {category}<span>{category === "All" ? visible.length : visible.filter((p) => p.category === category).length}</span>
                </button>
              ))}
            </div>
            {isEditing ? <Link href="/work/new" className="button button-dark small"><Plus size={17} /> New project</Link> : null}
          </div>
          <motion.div layout className="archive-grid">
            <AnimatePresence mode="popLayout">
              {filtered.map((project, index) => (
                <motion.div
                  layout
                  key={project.slug}
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.35 }}
                >
                  <ProjectCard project={project} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {filtered.length === 0 ? <div className="empty-state"><span>✳</span><h2>Nothing here yet.</h2><p>Try another filter, or make something new.</p></div> : null}
        </section>
      </main>
      <SiteFooter site={site} />
    </>
  );
}
