import { Home } from "@/components/home";
import { getProjects, getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [site, projects] = await Promise.all([getSiteContent(), getProjects()]);
  return <Home initialSite={site} initialProjects={projects.filter((project) => project.featured)} />;
}
