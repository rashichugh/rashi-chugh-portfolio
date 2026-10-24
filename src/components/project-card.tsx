import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/types/content";
import { cn } from "@/lib/utils";

export function ProjectCard({ project, index = 0, featured = false }: { project: Project; index?: number; featured?: boolean }) {
  return (
    <article className={cn("project-card", featured && `featured-card featured-card-${index % 5}`)} style={{ "--card-accent": project.accent } as React.CSSProperties}>
      <Link href={`/work/${project.slug}`} data-cursor="VIEW" aria-label={`View ${project.title} project`}>
        <div className="project-image-wrap">
          {project.coverImage ? (
            <img src={project.coverImage} alt={`${project.title} by Rashi Chugh`} className="project-cover" loading={index < 2 ? "eager" : "lazy"} />
          ) : (
            <div className="empty-cover"><span>Add a cover</span></div>
          )}
          <span className="project-number">/{String(index + 1).padStart(2, "0")}</span>
          {project.status === "draft" ? <span className="draft-badge">Draft</span> : null}
          <span className="project-arrow"><ArrowUpRight size={23} /></span>
        </div>
        <div className="project-card-meta">
          <div>
            <h3>{project.title}</h3>
            <p>{project.category}</p>
          </div>
          <span>{project.year}</span>
        </div>
      </Link>
    </article>
  );
}
