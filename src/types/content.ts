export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "gallery"
  | "video"
  | "quote"
  | "callout"
  | "list"
  | "divider"
  | "link"
  | "columns";

export type ContentBlock = {
  id: string;
  type: BlockType;
  hidden?: boolean;
  data: Record<string, unknown>;
};

export type ProjectStatus = "draft" | "published";

export type Project = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  coverImage: string;
  accent: string;
  tags: string[];
  tools: string[];
  behanceUrl: string;
  featured: boolean;
  status: ProjectStatus;
  sortOrder: number;
  blocks: ContentBlock[];
};

export type ExperienceItem = {
  role: string;
  company: string;
  period: string;
  description: string;
  color: string;
};

export type EducationItem = {
  degree: string;
  institution: string;
  period: string;
  description: string;
  color: string;
};

export type ServiceItem = {
  title: string;
  description: string;
  color: string;
  icon: string;
  /** Legacy text symbols are still read from older saved content. */
  symbol?: string;
};

export const toolShapes = ["arch", "square", "circle", "blob", "leaf"] as const;
export type ToolShape = (typeof toolShapes)[number];

export type ToolItem = {
  name: string;
  icon: string;
  color: string;
  shape?: ToolShape;
};

export type SiteContent = {
  name: string;
  role: string;
  heroTitle: string;
  heroAccent: string;
  intro: string;
  location: string;
  availability: string;
  showAvailability: boolean;
  email: string;
  phone: string;
  linkedinUrl: string;
  behanceUrl: string;
  resumeUrl: string;
  profileImage: string;
  aboutTitle: string;
  aboutBody: string;
  services: ServiceItem[];
  tools: ToolItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
};

export type AdminContext = {
  isAdmin: boolean;
  isDemo: boolean;
  authEnabled: boolean;
  email: string | null;
};
