import { redirect } from "next/navigation";
import { ProjectDetail } from "@/components/project-detail";
import { createEmptyProject } from "@/lib/default-content";
import { getAdminContext } from "@/lib/auth";
import { getProjects, getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/auth?next=/work/new");
  const [projects, site] = await Promise.all([getProjects(true), getSiteContent()]);
  return <ProjectDetail initialProject={createEmptyProject(projects.length)} initialProjects={projects} site={site} isNew />;
}
