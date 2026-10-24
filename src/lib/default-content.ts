import type { Project, SiteContent } from "@/types/content";

export const defaultSite: SiteContent = {
  name: "Rashi Chugh",
  role: "Graphic Designer · Motion Artist · Video Editor",
  heroTitle: "Making ideas",
  heroAccent: "look alive.",
  intro:
    "I’m Rashi — a graphic designer and motion artist turning briefs into bold, colourful, feels-something design.",
  location: "Gurugram, India",
  availability: "Available for freelance & project-based work",
  showAvailability: true,
  email: "rashichugh610@gmail.com",
  phone: "+91 97283 26661",
  linkedinUrl: "https://www.linkedin.com/in/rashi-chugh-298430423/",
  behanceUrl: "https://www.behance.net/rashichugh",
  resumeUrl: "/resume/rashi-chugh-resume.pdf",
  profileImage: "/images/profile/rashi-portrait.webp",
  aboutTitle: "Curious by nature. Colourful by choice.",
  aboutBody:
    "I’m a Gurugram-based graphic designer, video editor and motion graphics artist, currently pursuing a B.Voc at Jagannath University & Arena Animation. I love expressive type, playful colour and visuals that make people pause. From client logos to game assets and motion experiments, I enjoy turning loose ideas into thoughtful, memorable design.",
  services: [
    {
      title: "Graphic Design",
      description: "Posters, layouts and visual experiments with type, texture and a point of view.",
      color: "#DDF48B",
      icon: "PenTool",
    },
    {
      title: "Brand Identity",
      description: "Distinctive logos and identity systems that give brands a personality of their own.",
      color: "#F4B8D0",
      icon: "Shapes",
    },
    {
      title: "Motion & Video",
      description: "Motion graphics and edits that bring rhythm, energy and storytelling to the frame.",
      color: "#A9C6FF",
      icon: "Clapperboard",
    },
    {
      title: "Social Content",
      description: "Scroll-stopping campaign creatives, promotional posts and content built to connect.",
      color: "#FF936F",
      icon: "Megaphone",
    },
  ],
  tools: [
    { name: "Photoshop", icon: "/icons/tools/photoshop.svg", color: "#F5F0E6", shape: "arch" },
    { name: "Illustrator", icon: "/icons/tools/illustrator.svg", color: "#DDF48B", shape: "square" },
    { name: "Premiere Pro", icon: "/icons/tools/premiere-pro.svg", color: "#AFC8FF", shape: "circle" },
    { name: "After Effects", icon: "/icons/tools/after-effects.svg", color: "#F5F0E6", shape: "blob" },
    { name: "Audition", icon: "/icons/tools/audition.svg", color: "#DDF48B", shape: "leaf" },
    { name: "Canva", icon: "/icons/tools/canva.svg", color: "#AFC8FF", shape: "arch" },
    { name: "AI Design Tools", icon: "/icons/tools/ai-design-tools.svg", color: "#FFCF54", shape: "square" },
  ],
  experience: [
    {
      role: "Graphic Design Intern",
      company: "Spectre Rex · Frykar cooking game",
      period: "JUL 2026 — NOW",
      description:
        "Designing the game logo and visual assets in Photoshop and Illustrator, with a focus on style consistency, detail and collaborative feedback.",
      color: "#DDF48B",
    },
    {
      role: "Graphic Designer & Video Editor",
      company: "Freelance",
      period: "2025 — NOW",
      description:
        "Creating custom logos, editorial layouts and social visuals for clients, plus gaming video edits in After Effects. From first brief to final refinement.",
      color: "#F4B8D0",
    },
  ],
  education: [
    {
      degree: "B.Voc",
      institution: "Jagannath University & Arena Animation",
      period: "2025 — Present",
      description: "",
      color: "#AFC8FF",
    },
  ],
};

const image = (name: string) => `/images/projects/${name}.webp`;
const block = (id: string, type: "heading" | "paragraph" | "gallery" | "video" | "callout", data: Record<string, unknown>) => ({ id, type, data });

export const defaultProjects: Project[] = [
  {
    slug: "motion-graphics",
    title: "Motion Graphics",
    category: "Motion & Video",
    year: "2026",
    summary: "A collection of motion studies and edits — mixing type, rhythm and visual storytelling.",
    coverImage: image("motion-00"),
    accent: "#FFC94A",
    tags: ["Motion Graphics", "Video Editing"],
    tools: ["After Effects", "Premiere Pro"],
    behanceUrl: "https://www.behance.net/gallery/254091283/Motion-Graphics",
    featured: true,
    status: "published",
    sortOrder: 0,
    blocks: [
      block("motion-heading", "heading", { text: "Design, set in motion.", level: 2 }),
      block("motion-copy", "paragraph", {
        html: "A set of motion graphics and video editing explorations created with After Effects and Premiere Pro. Each piece plays with pacing, transitions and sound to make the visual feel alive.",
      }),
      block("motion-video-1", "video", { url: "/videos/motion-01.mp4", caption: "Motion study · 01", poster: image("motion-01-poster") }),
      block("motion-video-2", "video", { url: "/videos/motion-02.mp4", caption: "Motion study · 02", poster: image("motion-02-poster") }),
      block("motion-video-3", "video", { url: "/videos/motion-03.mp4", caption: "Motion study · 03", poster: image("motion-03-poster") }),
    ],
  },
  {
    slug: "logo-design",
    title: "Logo Design",
    category: "Brand Identity",
    year: "2026",
    summary: "Wordmarks, symbols and playful identities designed to make a lasting first impression.",
    coverImage: image("logo-00"),
    accent: "#F4B8D0",
    tags: ["Logo Design", "Visual Identity"],
    tools: ["Illustrator", "Photoshop"],
    behanceUrl: "https://www.behance.net/gallery/250965151/Logo-Design",
    featured: true,
    status: "published",
    sortOrder: 1,
    blocks: [
      block("logo-heading", "heading", { text: "Marks with meaning.", level: 2 }),
      block("logo-copy", "paragraph", {
        html: "A collection of logo explorations spanning wordmarks, symbolic identities and playful brand directions. The focus: simple forms, memorable silhouettes and type that feels at home with each brand.",
      }),
      block("logo-gallery", "gallery", {
        images: [image("logo-02"), image("logo-03"), image("logo-04"), image("logo-05")],
        captions: ["Brew Clip · Wordmark", "Svarun · Brand identity", "Himalayan Sip · Identity", "Waffle Story · Logo"],
        layout: "grid",
      }),
      block("logo-note", "callout", { text: "Made with Adobe Illustrator & Photoshop.", tone: "lime" }),
    ],
  },
  {
    slug: "posters",
    title: "Posters",
    category: "Graphic Design",
    year: "2026",
    summary: "Type, texture and composition come together in a series of expressive poster studies.",
    coverImage: image("posters-00"),
    accent: "#DDF48B",
    tags: ["Poster Design", "Typography", "Layout"],
    tools: ["Photoshop"],
    behanceUrl: "https://www.behance.net/gallery/250965307/Posters",
    featured: true,
    status: "published",
    sortOrder: 2,
    blocks: [
      block("poster-heading", "heading", { text: "Type. Texture. Impact.", level: 2 }),
      block("poster-copy", "paragraph", {
        html: "A series of poster studies across product, automotive and cultural themes. Each composition explores a different visual mood — from clean product storytelling to layered, high-energy graphics.",
      }),
      block("poster-gallery", "gallery", {
        images: [image("posters-02"), image("posters-03"), image("posters-04"), image("posters-05"), image("posters-06"), image("posters-07"), image("posters-08")],
        captions: ["Comet · Product poster", "Mahabhakti · Cultural poster", "Kawasaki · Automotive", "Nike SB Dunk · Product", "Poster study", "Aviation · Poster", "Poster exploration"],
        layout: "masonry",
      }),
    ],
  },
  {
    slug: "illustrations",
    title: "Illustrations",
    category: "Illustration",
    year: "2026",
    summary: "Character-led illustrations and digital drawing experiments with a playful streak.",
    coverImage: image("illustrations-00"),
    accent: "#A9C6FF",
    tags: ["Illustration", "Digital Art", "Character"],
    tools: ["Photoshop", "Illustrator"],
    behanceUrl: "https://www.behance.net/gallery/250965035/Illustrations",
    featured: true,
    status: "published",
    sortOrder: 3,
    blocks: [
      block("illustration-heading", "heading", { text: "Drawing outside the lines.", level: 2 }),
      block("illustration-copy", "paragraph", {
        html: "A mix of character studies, vector illustration and digital painting. These personal explorations are a space to experiment with expression, colour and different levels of detail.",
      }),
      block("illustration-gallery", "gallery", {
        images: [image("illustrations-02"), image("illustrations-03"), image("illustrations-04"), image("illustrations-05"), image("illustrations-06")],
        captions: ["Character study", "Lion · Vector illustration", "Luffy · Digital illustration", "The Mandalorian · Digital painting", "Character exploration"],
        layout: "masonry",
      }),
    ],
  },
  {
    slug: "creative-posts",
    title: "Creative Posts",
    category: "Social Media",
    year: "2026",
    summary: "Promotional creatives and social posts built to stop the scroll and start a feeling.",
    coverImage: image("creative-posts-00"),
    accent: "#FF936F",
    tags: ["Social Media", "Campaign Design", "Content"],
    tools: ["Photoshop"],
    behanceUrl: "https://www.behance.net/gallery/250964801/Creative-Posts",
    featured: true,
    status: "published",
    sortOrder: 4,
    blocks: [
      block("creative-heading", "heading", { text: "Made for the pause.", level: 2 }),
      block("creative-copy", "paragraph", {
        html: "A selection of social media creatives across food, automotive and festive communication. Bold hierarchy, clear messaging and a distinct mood keep each post recognisably its own.",
      }),
      block("creative-gallery", "gallery", {
        images: [image("creative-posts-02"), image("creative-posts-03"), image("creative-posts-04"), image("creative-posts-05")],
        captions: ["GT Mustang · Automotive creative", "Grand Opening · Restaurant creative", "Janmashtami · Festive creative", "Food Menu · Promotional creative"],
        layout: "grid",
      }),
    ],
  },
];

export function createEmptyProject(sortOrder = 0): Project {
  return {
    slug: "new-project",
    title: "Untitled project",
    category: "Graphic Design",
    year: String(new Date().getFullYear()),
    summary: "A short, punchy description of this project.",
    coverImage: "",
    accent: "#DDF48B",
    tags: [],
    tools: [],
    behanceUrl: "",
    featured: true,
    status: "draft",
    sortOrder,
    blocks: [
      { id: cryptoId(), type: "heading", data: { text: "Start the story", level: 2 } },
      { id: cryptoId(), type: "paragraph", data: { html: "Write about the brief, your thinking and what you made." } },
    ],
  };
}

export function cryptoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
