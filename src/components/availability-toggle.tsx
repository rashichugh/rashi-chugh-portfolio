"use client";

export function AvailabilityToggle({ checked, onChange, className = "" }: { checked: boolean; onChange: (checked: boolean) => void; className?: string }) {
  return (
    <button
      type="button"
      className={`availability-toggle ${checked ? "is-on" : ""} ${className}`}
      role="switch"
      aria-checked={checked}
      aria-label="Show open to freelance availability"
      onClick={() => onChange(!checked)}
    >
      <span className="availability-toggle-track" aria-hidden="true"><span /></span>
      <span>Open to freelance</span>
      <strong>{checked ? "ON" : "OFF"}</strong>
    </button>
  );
}
