import type { Metadata } from "next";
import { WorkArchive } from "@/components/work-archive";
import { getAdminContext } from "@/lib/auth";
import { getProjects, getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Work", description: "Graphic design, brand identity, illustration, social media and motion projects by Rashi Chugh." };

export default async function WorkPage() {
  const admin = await getAdminContext();
  const [projects, site] = await Promise.all([getProjects(admin.isAdmin), getSiteContent()]);
  return <WorkArchive initialProjects={projects} initialSite={site} />;
}
