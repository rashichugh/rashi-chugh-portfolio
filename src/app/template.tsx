"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <motion.div
      className="page-transition"
      initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.58, delay: reducedMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
