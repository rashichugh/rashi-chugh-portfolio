"use client";

import { GraduationCap, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "@/components/admin-provider";
import { useDialog } from "@/components/dialog";
import { ColorPicker } from "@/components/color-picker";
import { InlineText } from "@/components/inline-text";
import { Reveal } from "@/components/motion";
import { SaveIndicator, type SaveState } from "@/components/save-indicator";
import { IconPicker, legacyServiceIcons, ServiceIcon } from "@/components/service-icon";
import { SiteFooter } from "@/components/site-footer";
import { StickerArt } from "@/components/sticker-art";
import { StickerTrail } from "@/components/sticker-trail";
import { ToolIcon } from "@/components/tool-icon";
import { ToolIconEditor } from "@/components/tool-icon-editor";
import { useDemoSite } from "@/components/use-demo-content";
import { saveSite } from "@/lib/demo-store";
import { toolShapes, type EducationItem, type ExperienceItem, type ServiceItem, type SiteContent, type ToolItem } from "@/types/content";

function normalizeTools(value: ToolItem[] | string[]): ToolItem[] {
  const colors = ["#F5F0E6", "#DDF48B", "#AFC8FF"];
  return value.map((item, index) => {
    const tool = typeof item === "string" ? { name: item, icon: "", color: "" } : item;
    return { ...tool, color: tool.color || colors[index % colors.length], shape: "shape" in tool && tool.shape ? tool.shape : toolShapes[index % toolShapes.length] };
  });
}

function normalizeEducation(value: EducationItem[] | string): EducationItem[] {
  if (Array.isArray(value)) return value;
  if (!value.trim()) return [];
  const [degree, institution = "", period = ""] = value.split(" · ");
  return [{ degree, institution, period, description: "", color: "#AFC8FF" }];
}

function JourneyCardControls({ color, onColor, onRemove, label }: { color: string; onColor: (color: string) => void; onRemove: () => void; label: string }) {
  const { showConfirm } = useDialog();
  return <div className="journey-card-controls" data-no-cursor><ColorPicker value={color} onChange={onColor} label={label} /><button type="button" onClick={async () => {
    const confirmed = await showConfirm({ title: `Remove this ${label.toLowerCase()} card?`, message: "The card will be removed from Journey So Far. This change saves automatically.", confirmLabel: "Remove card", danger: true });
    if (confirmed) onRemove();
  }}>Remove card</button></div>;
}

export function About({ initialSite }: { initialSite: SiteContent }) {
  const { isEditing, isDemo } = useAdmin();
  const [site, setSite, persistedSite] = useDemoSite(initialSite);
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
  const updateService = (index: number, patch: Partial<ServiceItem>) => setSite((current) => ({ ...current, services: current.services.map((service, i) => i === index ? { ...service, ...patch } : service) }));
  const updateTool = (index: number, patch: Partial<ToolItem>) => setSite((current) => ({ ...current, tools: normalizeTools(current.tools).map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const updateExperience = (index: number, patch: Partial<ExperienceItem>) => setSite((current) => ({ ...current, experience: current.experience.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const updateEducation = (index: number, patch: Partial<EducationItem>) => setSite((current) => ({ ...current, education: normalizeEducation(current.education).map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const toolItems = normalizeTools(site.tools);
  const educationItems = normalizeEducation(site.education);
  const journeyColors = ["#DDF48B", "#F4B8D0", "#AFC8FF", "#FF936F"];

  return (
    <>
      {isEditing ? <SaveIndicator state={saveState} onSave={() => void performSave(site)} /> : null}
      <main id="top" className="about-page-main">
        <StickerTrail scope="about" />
        <section className="about-section section-pad" id="about">
          <div className="about-grid">
            <Reveal className="about-copy">
              <p className="section-kicker"><span>01</span> A LITTLE ABOUT ME</p>
              <InlineText as="h1" value={site.aboutTitle} editing={isEditing} onChange={(aboutTitle) => update({ aboutTitle })} multiline label="About heading" />
              <InlineText as="p" className="about-body" value={site.aboutBody} editing={isEditing} onChange={(aboutBody) => update({ aboutBody })} multiline label="About Rashi" />
              <div className="about-location"><span>↳</span> Based in {site.location}, working everywhere.</div>
            </Reveal>
            <Reveal className="about-collage" delay={0.12}>
              <div className="collage-main"><img src="/images/projects/illustrations-05.webp" alt="Mandalorian digital painting by Rashi" /></div>
              <div className="collage-small"><img src="/images/projects/illustrations-02.webp" alt="Character illustration by Rashi" /></div>
              <div className="collage-note">also fluent in<br /><strong>“one last tweak”</strong></div>
              <div className="collage-sticker" aria-hidden="true"><StickerArt variant="wow" /></div>
              <div className="collage-star" aria-hidden="true">✳</div>
            </Reveal>
          </div>
          <Reveal className="tools-row">
            <div className="tools-heading"><span className="tools-label">MY EVERYDAY TOOLKIT</span><span className="tools-note">the creative sidekicks <span>↘</span></span></div>
            <div className="tool-grid">
              {toolItems.map((tool, index) => (
                <article className={`tool-card shape-${tool.shape ?? "square"} ${isEditing ? "is-editing" : ""}`} key={`${tool.name}-${index}`} style={{ "--tool-color": tool.color } as React.CSSProperties}>
                  <div className="tool-card-icon">{isEditing ? <ToolIconEditor name={tool.name} icon={tool.icon} isDemo={isDemo} onChange={(icon) => updateTool(index, { icon })} size={44} /> : <ToolIcon name={tool.name} icon={tool.icon} size={44} />}</div>
                  {isEditing ? <InlineText className="tool-card-name" value={tool.name} editing onChange={(name) => updateTool(index, { name })} label="Tool name" /> : <span className="tool-card-name">{tool.name}</span>}
                  {isEditing ? <>
                    <div className="tool-shape-selector" role="group" aria-label={`${tool.name} card shape`} data-no-cursor>{toolShapes.map((shape) => <button key={shape} type="button" className={tool.shape === shape ? "active" : ""} onClick={() => updateTool(index, { shape })} aria-label={`Select ${shape} shape for ${tool.name}`} aria-pressed={tool.shape === shape} title={`${shape} shape`}><span className={`tool-shape-sample shape-${shape}`} /></button>)}</div>
                    <div className="tool-card-controls" data-no-cursor><ColorPicker value={tool.color} onChange={(color) => updateTool(index, { color })} label={tool.name} /><button type="button" className="tool-remove" onClick={() => setSite((current) => ({ ...current, tools: normalizeTools(current.tools).filter((_, i) => i !== index) }))} aria-label={`Remove ${tool.name}`}><X size={14} /></button></div>
                  </> : null}
                </article>
              ))}
              {isEditing ? <button type="button" className="add-tool-card" data-no-cursor onClick={() => setSite((current) => ({ ...current, tools: [...normalizeTools(current.tools), { name: "New tool", icon: "", color: "#F5F0E6", shape: "square" }] }))}><Plus size={19} /> Add tool card</button> : null}
            </div>
          </Reveal>
        </section>

        <section className="services-section section-pad">
          <Reveal className="services-heading"><p className="section-kicker light"><span>02</span> WHAT I DO</p><h2>Good design should<br /><em>feel like something.</em></h2><p>Clear thinking, expressive visuals, and just enough weird to make it memorable.</p></Reveal>
          <div className="services-grid">{site.services.map((service, index) => {
            const iconName = service.icon || legacyServiceIcons[service.symbol ?? ""] || "Sparkles";
            return <Reveal key={index} delay={index * 0.07}><article className={`service-card ${isEditing ? "is-editing" : ""}`} style={{ "--service-color": service.color } as React.CSSProperties}><div className="service-card-top"><span>{String(index + 1).padStart(2, "0")}</span>{isEditing ? <IconPicker value={iconName} onChange={(icon) => updateService(index, { icon })} label={service.title} /> : <span className="service-symbol"><ServiceIcon name={iconName} /></span>}</div><InlineText as="h3" value={service.title} editing={isEditing} onChange={(title) => updateService(index, { title })} label="Service title" /><InlineText as="p" value={service.description} editing={isEditing} onChange={(description) => updateService(index, { description })} multiline label="Service description" /></article></Reveal>;
          })}</div>
        </section>

        <section className="experience-section section-pad">
          <Reveal className="experience-heading"><p className="section-kicker"><span>03</span> THE JOURNEY SO FAR</p><h2>Learning by<br /><em>doing the work.</em></h2></Reveal>
          <div className="experience-list">
            <p className="journey-group-label">WORK EXPERIENCE</p>
            {site.experience.map((item, index) => <Reveal key={index} delay={index * 0.08}><article className={`experience-card ${isEditing ? "is-editing" : ""}`} style={{ "--experience-color": item.color } as React.CSSProperties}><div className="experience-period"><InlineText value={item.period} editing={isEditing} onChange={(period) => updateExperience(index, { period })} label="Work period" /></div><div className="experience-main"><InlineText as="h3" value={item.role} editing={isEditing} onChange={(role) => updateExperience(index, { role })} label="Work role" /><InlineText as="h4" value={item.company} editing={isEditing} onChange={(company) => updateExperience(index, { company })} label="Company or client" /><InlineText as="p" value={item.description} editing={isEditing} onChange={(description) => updateExperience(index, { description })} multiline label="Work description" /></div><span className="experience-dot" />{isEditing ? <JourneyCardControls color={item.color} onColor={(color) => updateExperience(index, { color })} onRemove={() => setSite((current) => ({ ...current, experience: current.experience.filter((_, i) => i !== index) }))} label="Work" /> : null}</article></Reveal>)}
            {isEditing ? <button type="button" className="add-journey-card" data-no-cursor onClick={() => setSite((current) => ({ ...current, experience: [...current.experience, { role: "New role", company: "Company or client", period: "2026 — Present", description: "Add a short description of your work.", color: journeyColors[current.experience.length % journeyColors.length] }] }))}><Plus size={18} /> Add work card</button> : null}
            <p className="journey-group-label education-label">EDUCATION</p>
            {educationItems.map((item, index) => <Reveal key={index} delay={index * 0.08}><article className={`education-card ${isEditing ? "is-editing" : ""}`} style={{ "--experience-color": item.color } as React.CSSProperties}><div className="education-period"><InlineText value={item.period} editing={isEditing} onChange={(period) => updateEducation(index, { period })} label="Education period" /></div><div className="education-main"><InlineText as="h3" value={item.degree} editing={isEditing} onChange={(degree) => updateEducation(index, { degree })} label="Degree or qualification" /><InlineText as="h4" value={item.institution} editing={isEditing} onChange={(institution) => updateEducation(index, { institution })} label="Educational institution" />{item.description || isEditing ? <InlineText as="p" value={item.description} editing={isEditing} onChange={(description) => updateEducation(index, { description })} multiline label="Education description, optional" /> : null}</div><GraduationCap className="education-icon" size={27} aria-hidden="true" />{isEditing ? <JourneyCardControls color={item.color} onColor={(color) => updateEducation(index, { color })} onRemove={() => setSite((current) => ({ ...current, education: normalizeEducation(current.education).filter((_, i) => i !== index) }))} label="Education" /> : null}</article></Reveal>)}
            {isEditing ? <button type="button" className="add-journey-card" data-no-cursor onClick={() => setSite((current) => ({ ...current, education: [...normalizeEducation(current.education), { degree: "New qualification", institution: "Institution", period: "2026 — Present", description: "", color: journeyColors[normalizeEducation(current.education).length % journeyColors.length] }] }))}><Plus size={18} /> Add education card</button> : null}
          </div>
        </section>
      </main>
      <SiteFooter site={site} editing={isEditing} onUpdate={update} />
    </>
  );
}
