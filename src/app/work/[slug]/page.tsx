import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/project-detail";
import { getAdminContext } from "@/lib/auth";
import { createEmptyProject } from "@/lib/default-content";
import { getProject, getProjects, getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const admin = await getAdminContext();
  const project = await getProject(slug, admin.isAdmin);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.summary, openGraph: { images: project.coverImage ? [project.coverImage] : undefined } };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const admin = await getAdminContext();
  const [project, projects, site] = await Promise.all([getProject(slug, admin.isAdmin), getProjects(admin.isAdmin), getSiteContent()]);
  if (!project && admin.isDemo) {
    const placeholder = { ...createEmptyProject(), slug, title: "Opening project…", summary: "" };
    return <ProjectDetail initialProject={placeholder} initialProjects={projects} site={site} demoOnly />;
  }
  if (!project) notFound();
  return <ProjectDetail initialProject={project} initialProjects={projects} site={site} />;
}
