"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, LoaderCircle, Palette, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "@/components/admin-provider";
import { useDialog } from "@/components/dialog";
import { BlockRenderer } from "@/components/block-renderer";
import { ColorPicker } from "@/components/color-picker";
import { BlockEditor } from "@/components/editor/block-editor";
import { MediaField } from "@/components/editor/media-field";
import { InlineText } from "@/components/inline-text";
import type { SaveState } from "@/components/save-indicator";
import { SiteFooter } from "@/components/site-footer";
import { useDemoProjects } from "@/components/use-demo-content";
import { deleteProject, readDemoProjects, saveProject } from "@/lib/demo-store";
import { getContrastForeground } from "@/lib/color";
import { slugify, splitList } from "@/lib/utils";
import type { Project, ProjectStatus, SiteContent } from "@/types/content";

export function ProjectDetail({ initialProject, initialProjects, site, isNew = false, demoOnly = false }: {
  initialProject: Project;
  initialProjects: Project[];
  site: SiteContent;
  isNew?: boolean;
  demoOnly?: boolean;
}) {
  const { isEditing, isDemo, setMode } = useAdmin();
  const { showAlert, showConfirm } = useDialog();
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [projects] = useDemoProjects(initialProjects);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [creating, setCreating] = useState(isNew);
  const [demoState, setDemoState] = useState<"checking" | "ready" | "missing">(demoOnly ? "checking" : "ready");
  const originalSlug = useRef(initialProject.slug);

  useEffect(() => {
    if (isNew) setMode("edit");
  }, [isNew, setMode]);

  useEffect(() => {
    if (!isDemo || isNew) return;
    const frame = requestAnimationFrame(() => {
      const local = readDemoProjects(initialProjects).find((item) => item.slug === initialProject.slug);
      if (local) {
        setProject(local);
        if (demoOnly) {
          originalSlug.current = local.slug;
          setDemoState("ready");
        }
      } else if (demoOnly) {
        setDemoState("missing");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [initialProject.slug, initialProjects, isDemo, isNew, demoOnly]);

  const change = (patch: Partial<Project>) => {
    setProject((current) => ({ ...current, ...patch }));
    setSaveState("unsaved");
  };

  async function save(status: ProjectStatus) {
    if (!project.title.trim()) {
      await showAlert({ title: "Give it a title first", message: "Add a project title before saving a draft or publishing." });
      return;
    }
    if (!project.slug.trim()) change({ slug: slugify(project.title) });
    setSaveState("saving");
    try {
      const saved = await saveProject({ ...project, status, slug: slugify(project.slug || project.title) }, originalSlug.current, creating, isDemo);
      setProject(saved);
      setCreating(false);
      originalSlug.current = saved.slug;
      window.history.replaceState(null, "", `/work/${saved.slug}`);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1600);
    } catch (error) {
      console.error(error);
      await showAlert({ title: "Could not save project", message: error instanceof Error ? error.message : "Please try saving again.", danger: true });
      setSaveState("error");
    }
  }

  async function remove() {
    const confirmed = await showConfirm({ title: "Delete this project?", message: `“${project.title}” and its complete story will be permanently removed. This cannot be undone.`, confirmLabel: "Delete project", danger: true });
    if (!confirmed) return;
    setSaveState("saving");
    try {
      await deleteProject(originalSlug.current, isDemo);
      router.push("/work");
      router.refresh();
    } catch (error) {
      await showAlert({ title: "Could not delete project", message: error instanceof Error ? error.message : "Please try again.", danger: true });
      setSaveState("error");
    }
  }

  const nextProject = useMemo(() => {
    if (creating) return null;
    const published = projects.filter((item) => item.status === "published").sort((a, b) => a.sortOrder - b.sortOrder);
    if (published.length < 2) return null;
    const index = published.findIndex((item) => item.slug === project.slug);
    return published[(index + 1 + published.length) % published.length];
  }, [creating, project.slug, projects]);

  if (demoState === "checking") {
    return <main className="not-found section-pad"><p className="section-kicker">OPENING THE PROJECT…</p></main>;
  }
  if (demoState === "missing") {
    return <main className="not-found section-pad"><p className="section-kicker">PROJECT NOT FOUND</p><h1>This project isn’t in<br /><em>this demo browser.</em></h1><Link href="/work" className="button button-dark"><ArrowLeft size={18} /> Back to all work</Link></main>;
  }

  return (
    <>
      <main className="project-page" id="top" style={{ "--project-accent": project.accent, "--project-foreground": getContrastForeground(project.accent) } as React.CSSProperties}>
        {isEditing ? (
          <div className="project-save-bar" data-no-cursor>
            <div><span className={`save-state-dot ${saveState}`} />{creating ? "Creating a new project" : `Editing · ${project.title}`}<small>{saveState === "unsaved" ? "Unsaved changes" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save error" : project.status}</small></div>
            <section>
              <button className="button button-cream small" onClick={() => void save("draft")} disabled={saveState === "saving"}>Save draft</button>
              <button className="button button-lime small" onClick={() => void save("published")} disabled={saveState === "saving"}>{saveState === "saving" ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Publish</button>
              {!creating ? <button className="delete-project" onClick={() => void remove()}><Trash2 size={16} /> Delete</button> : null}
            </section>
          </div>
        ) : null}
        <section className="project-hero section-pad">
          <Link href="/work" className="back-link"><ArrowLeft size={17} /> All work</Link>
          <div className="project-hero-grid">
            <div>
              <div className="project-overline">
                <InlineText value={project.category} editing={isEditing} onChange={(category) => change({ category })} />
                <span>·</span>
                <InlineText value={project.year} editing={isEditing} onChange={(year) => change({ year })} />
              </div>
              <InlineText as="h1" value={project.title} editing={isEditing} onChange={(title) => change({ title, ...(creating ? { slug: slugify(title) } : {}) })} multiline label="Project title" />
              <InlineText as="p" className="project-summary" value={project.summary} editing={isEditing} onChange={(summary) => change({ summary })} multiline label="Project summary" />
              <div className="project-tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
            <div className="project-side-meta">
              <span>TOOLS USED</span>
              <p>{project.tools.join(" · ") || "Add tools"}</p>
              {project.behanceUrl ? <a href={project.behanceUrl} target="_blank" rel="noreferrer" className="button button-dark small"><Palette size={17} /> View on Behance <ArrowUpRight size={16} /></a> : null}
            </div>
          </div>
          <div className="project-hero-cover">
            {project.coverImage ? <img src={project.coverImage} alt={`${project.title} cover`} fetchPriority="high" /> : <div className="empty-cover"><Plus /><span>Add a cover in project settings</span></div>}
          </div>
        </section>

        {isEditing ? (
          <section className="project-settings section-pad" data-no-cursor>
            <div className="settings-heading"><span>PROJECT SETTINGS</span><p>The details behind the page. Everything saves with the story below.</p></div>
            <div className="settings-grid">
              <label><span>URL slug</span><input value={project.slug} onChange={(e) => change({ slug: slugify(e.target.value) })} /></label>
              <label><span>Tags · comma separated</span><input value={project.tags.join(", ")} onChange={(e) => change({ tags: splitList(e.target.value) })} /></label>
              <label><span>Tools · comma separated</span><input value={project.tools.join(", ")} onChange={(e) => change({ tools: splitList(e.target.value) })} /></label>
              <label><span>Behance URL</span><input value={project.behanceUrl} onChange={(e) => change({ behanceUrl: e.target.value })} placeholder="https://behance.net/gallery/…" /></label>
              <label><span>Accent colour</span><span className="colour-input"><ColorPicker value={project.accent} onChange={(accent) => change({ accent })} label="Project accent" /><input value={project.accent} onChange={(e) => change({ accent: e.target.value })} aria-label="Project accent hex value" /></span></label>
              <label><span>Sort order</span><input type="number" value={project.sortOrder} onChange={(e) => change({ sortOrder: Number(e.target.value) })} /></label>
              <label className="settings-check"><input type="checkbox" checked={project.featured} onChange={(e) => change({ featured: e.target.checked })} /> Feature on home page</label>
            </div>
            <MediaField value={project.coverImage} onChange={(coverImage) => change({ coverImage })} isDemo={isDemo} label="Cover image" />
          </section>
        ) : null}

        <section className={`project-content section-pad ${isEditing ? "is-editing" : ""}`}>
          {isEditing ? (
            <BlockEditor blocks={project.blocks} onChange={(blocks) => change({ blocks })} isDemo={isDemo} />
          ) : (
            <BlockRenderer blocks={project.blocks} />
          )}
        </section>

        {!isEditing && nextProject ? (
          <section className="next-project section-pad">
            <p>NEXT PROJECT</p>
            <Link href={`/work/${nextProject.slug}`} data-cursor="NEXT">
              <div><span>{nextProject.category}</span><h2>{nextProject.title}</h2></div>
              <div className="next-project-image"><img src={nextProject.coverImage} alt="" loading="lazy" /><ArrowRight /></div>
            </Link>
          </section>
        ) : null}
      </main>
      <SiteFooter site={site} />
    </>
  );
}
