export type StickerVariant = "smiley" | "spark" | "wow" | "flower" | "heart";

export function StickerArt({ variant, className = "" }: { variant: StickerVariant; className?: string }) {
  const classNames = `sticker-art sticker-art-${variant} ${className}`;
  if (variant === "smiley") {
    return (
      <svg className={classNames} viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="47" fill="var(--lime)" stroke="var(--white)" strokeWidth="10" />
        <circle cx="60" cy="60" r="47" fill="none" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="43" cy="50" r="5" fill="var(--ink)" /><circle cx="77" cy="50" r="5" fill="var(--ink)" />
        <path d="M37 69c7 19 34 24 48 2" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
        <path d="M31 63l-8 3M89 63l8 3" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "spark") {
    const path = "M60 7l10 31 26-20-15 31 32 2-31 12 25 22-32-10 3 33-17-28-17 29 1-34-33 11 25-23-31-11 33-3-16-30 27 19z";
    return (
      <svg className={classNames} viewBox="0 0 120 120" aria-hidden="true">
        <path d={path} fill="var(--yellow)" stroke="var(--white)" strokeWidth="9" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="60" cy="60" r="14" fill="var(--orange)" stroke="var(--ink)" strokeWidth="2" />
      </svg>
    );
  }
  if (variant === "wow") {
    const path = "M19 30c12-18 29-9 39-18 12-11 25 3 26 16 18-3 26 13 16 26 14 11 6 27-9 29 2 18-17 25-29 14-9 15-27 10-29-4-17 5-28-10-20-24-15-7-14-25-2-32-2-3-1-5 2-7z";
    return (
      <svg className={classNames} viewBox="0 0 120 120" aria-hidden="true">
        <path d={path} fill="var(--pink)" stroke="var(--white)" strokeWidth="10" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        <text x="60" y="68" textAnchor="middle" fill="var(--ink)" fontFamily="Manrope, Arial, sans-serif" fontSize="27" fontWeight="800" letterSpacing="-2">WOW!</text>
      </svg>
    );
  }
  if (variant === "flower") {
    return (
      <svg className={classNames} viewBox="0 0 120 120" aria-hidden="true">
        <g fill="var(--blue)" stroke="var(--white)" strokeWidth="8">
          <ellipse cx="60" cy="32" rx="20" ry="27" /><ellipse cx="60" cy="88" rx="20" ry="27" />
          <ellipse cx="32" cy="60" rx="27" ry="20" /><ellipse cx="88" cy="60" rx="27" ry="20" />
          <ellipse cx="40" cy="40" rx="20" ry="25" transform="rotate(-45 40 40)" /><ellipse cx="80" cy="80" rx="20" ry="25" transform="rotate(-45 80 80)" />
          <ellipse cx="80" cy="40" rx="20" ry="25" transform="rotate(45 80 40)" /><ellipse cx="40" cy="80" rx="20" ry="25" transform="rotate(45 40 80)" />
        </g>
        <g fill="none" stroke="var(--ink)" strokeWidth="1.5">
          <ellipse cx="60" cy="32" rx="20" ry="27" /><ellipse cx="60" cy="88" rx="20" ry="27" />
          <ellipse cx="32" cy="60" rx="27" ry="20" /><ellipse cx="88" cy="60" rx="27" ry="20" />
        </g>
        <circle cx="60" cy="60" r="24" fill="var(--yellow)" stroke="var(--white)" strokeWidth="7" />
        <circle cx="60" cy="60" r="24" fill="none" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="52" cy="57" r="2.8" fill="var(--ink)" /><circle cx="68" cy="57" r="2.8" fill="var(--ink)" />
        <path d="M51 66c5 6 13 6 18 0" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={classNames} viewBox="0 0 120 120" aria-hidden="true">
      <path d="M60 101C46 88 17 69 17 43c0-26 32-31 43-11 11-20 43-15 43 11 0 26-29 45-43 58z" fill="var(--orange)" stroke="var(--white)" strokeWidth="10" strokeLinejoin="round" />
      <path d="M60 101C46 88 17 69 17 43c0-26 32-31 43-11 11-20 43-15 43 11 0 26-29 45-43 58z" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 46l7 7M73 53l7-7M46 69c9 7 20 7 28-1" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
