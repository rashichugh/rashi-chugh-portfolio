"use client";

import type { Project, SiteContent } from "@/types/content";

const SITE_KEY = "rashi-studio-site-v1";
const PROJECTS_KEY = "rashi-studio-projects-v1";
const UPDATE_EVENT = "rashi-studio-update";

function notify() {
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function onStudioUpdate(callback: () => void) {
  window.addEventListener(UPDATE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(UPDATE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function readDemoSite(fallback: SiteContent) {
  try {
    const value = localStorage.getItem(SITE_KEY);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
}

export function readDemoProjects(fallback: Project[]) {
  try {
    const value = localStorage.getItem(PROJECTS_KEY);
    if (!value) return fallback;
    const saved = JSON.parse(value) as Project[];
    return saved.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return fallback;
  }
}

export async function saveSite(site: SiteContent, isDemo: boolean) {
  if (isDemo) {
    localStorage.setItem(SITE_KEY, JSON.stringify(site));
    notify();
    return;
  }
  const response = await fetch("/api/admin/site", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(site),
  });
  if (!response.ok) throw new Error((await response.json()).error ?? "Unable to save site");
}

export async function saveProject(project: Project, originalSlug: string, isNew: boolean, isDemo: boolean) {
  if (isDemo) {
    const { defaultProjects } = await import("@/lib/default-content");
    const projects = readDemoProjects(defaultProjects);
    const next = isNew
      ? [...projects.filter((item) => item.slug !== project.slug), project]
      : projects.map((item) => item.slug === originalSlug ? project : item);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
    notify();
    return project;
  }
  const response = await fetch(isNew ? "/api/admin/projects" : `/api/admin/projects/${encodeURIComponent(originalSlug)}`, {
    method: isNew ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Unable to save project");
  return data.project as Project;
}

export async function deleteProject(slug: string, isDemo: boolean) {
  if (isDemo) {
    const { defaultProjects } = await import("@/lib/default-content");
    const next = readDemoProjects(defaultProjects).filter((project) => project.slug !== slug);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
    notify();
    return;
  }
  const response = await fetch(`/api/admin/projects/${encodeURIComponent(slug)}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to delete project");
}

async function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File) {
  const source = await fileAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });
  const scale = Math.min(1, 1400 / image.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.84);
}

export async function uploadToolSvg(file: File, isDemo: boolean) {
  if (file.type !== "image/svg+xml" && !file.name.toLowerCase().endsWith(".svg")) throw new Error("Please choose an SVG file.");
  if (file.size > 2 * 1024 * 1024) throw new Error("SVG icons must be under 2 MB.");
  const source = await file.text();
  if (!source.toLowerCase().includes("<svg")) throw new Error("This file does not contain a valid SVG.");
  const svgFile = new File([source], file.name, { type: "image/svg+xml" });
  if (isDemo) return fileAsDataUrl(svgFile);
  return uploadMedia(svgFile, false);
}

export async function uploadMedia(file: File, isDemo: boolean) {
  if (isDemo) {
    if (file.type.startsWith("image/")) return compressImage(file);
    if (file.size > 4 * 1024 * 1024) throw new Error("Demo videos must be under 4 MB. Connect Supabase for larger files.");
    return fileAsDataUrl(file);
  }
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Upload failed");
  return data.publicUrl as string;
}
