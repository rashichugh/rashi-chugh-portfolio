const builtInToolIcons: Record<string, string> = {
  photoshop: "/icons/tools/photoshop.svg",
  illustrator: "/icons/tools/illustrator.svg",
  premiere: "/icons/tools/premiere-pro.svg",
  "after effects": "/icons/tools/after-effects.svg",
  audition: "/icons/tools/audition.svg",
  canva: "/icons/tools/canva.svg",
  ai: "/icons/tools/ai-design-tools.svg",
};

export function defaultToolIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes("photoshop")) return builtInToolIcons.photoshop;
  if (key.includes("illustrator")) return builtInToolIcons.illustrator;
  if (key.includes("premiere")) return builtInToolIcons.premiere;
  if (key.includes("after effects")) return builtInToolIcons["after effects"];
  if (key.includes("audition")) return builtInToolIcons.audition;
  if (key.includes("canva")) return builtInToolIcons.canva;
  if (key.includes("ai") || key.includes("artificial intelligence")) return builtInToolIcons.ai;
  return "";
}

export function ToolIcon({ name, icon = "", size = 25 }: { name: string; icon?: string; size?: number }) {
  const source = icon || defaultToolIcon(name);
  if (source) return <img className="tool-icon-image" src={source} alt="" width={size} height={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#f5f0e6" stroke="rgba(29,41,35,.28)" />
      <text x="16" y="20.5" textAnchor="middle" fill="#1d2923" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" letterSpacing="-.5">{name.trim().slice(0, 2).toUpperCase() || "?"}</text>
    </svg>
  );
}
