"use client";

import { motion, useMotionValue, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function Reveal({ children, className, delay = 0, y = 34 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ type: "spring", stiffness: 105, damping: 19, mass: 0.75, delay }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.25 });
  return <motion.div className="scroll-progress" style={{ scaleX }} />;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function CustomCursor() {
  const reducedMotion = usePrefersReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const [native, setNative] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [onDark, setOnDark] = useState(false);

  useEffect(() => {
    if (reducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = event.target instanceof Element ? event.target : null;
      const isNative = Boolean(target?.closest("[data-no-cursor], input, textarea, select, [contenteditable='true']"));
      setNative(isNative);
      setLabel(isNative ? "" : target?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "");
      setHovering(Boolean(target?.closest("a, button, [role='button'], .tool-card")));
      setOnDark(Boolean(target?.closest(".playground, .services-section, .mobile-nav, .admin-menu, .project-save-bar")));
    };
    const leave = () => setVisible(false);
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [reducedMotion, x, y]);

  if (reducedMotion) return null;
  const opacity = visible && !native ? 1 : 0;
  const themeClass = onDark ? "on-dark" : "";

  return (
    <>
      <motion.div
        className={`custom-cursor ${label ? "has-label" : ""} ${native ? "is-native" : ""} ${themeClass}`}
        style={{ x, y }}
        animate={{ opacity }}
        transition={{ duration: 0.15 }}
        aria-hidden="true"
      >
        <motion.div className="cursor-ring" animate={{ scale: pressed ? 0.78 : hovering || label ? 1.28 : 1 }} transition={{ duration: 0.18, ease: "easeOut" }} />
        {label ? <motion.span key={label} className="cursor-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{label}</motion.span> : null}
      </motion.div>
      <motion.div
        className={`cursor-dot ${native ? "is-native" : ""} ${themeClass}`}
        style={{ x, y }}
        animate={{ opacity, scale: pressed ? 1.65 : hovering ? 0.75 : 1 }}
        transition={{ duration: 0.14 }}
        aria-hidden="true"
      />
    </>
  );
}
