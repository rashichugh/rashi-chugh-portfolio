"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/motion";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const [covering, setCovering] = useState(false);
  const coveringRef = useRef(false);
  const navigationTimer = useRef(0);

  useEffect(() => {
    const revealTimer = window.setTimeout(() => {
      coveringRef.current = false;
      setCovering(false);
    }, 70);
    return () => window.clearTimeout(revealTimer);
  }, [pathname]);

  useEffect(() => {
    if (!covering) return;
    const safetyTimer = window.setTimeout(() => {
      coveringRef.current = false;
      setCovering(false);
    }, 7000);
    return () => window.clearTimeout(safetyTimer);
  }, [covering]);

  useEffect(() => {
    if (reducedMotion) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || coveringRef.current) return;
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.dataset.noTransition === "true") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      coveringRef.current = true;
      setCovering(true);
      window.clearTimeout(navigationTimer.current);
      navigationTimer.current = window.setTimeout(() => router.push(`${url.pathname}${url.search}${url.hash}`), 380);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reducedMotion, router]);

  useEffect(() => () => window.clearTimeout(navigationTimer.current), []);

  return (
    <>
      {children}
      {!reducedMotion ? (
        <motion.div
          className="page-wipe route-transition-overlay"
          initial={false}
          animate={{ scaleY: covering ? 1 : 0 }}
          transition={{ duration: covering ? 0.38 : 0.68, ease: [0.76, 0, 0.24, 1] }}
          style={{ transformOrigin: covering ? "50% 100%" : "50% 0%", pointerEvents: covering ? "auto" : "none" }}
          aria-hidden="true"
        >
          <motion.div className="route-transition-mark" animate={{ opacity: covering ? 1 : 0, scale: covering ? 1 : 0.92 }} transition={{ duration: covering ? 0.2 : 0.12, delay: covering ? 0.2 : 0 }}>
            <span>✳</span><strong>RASHI / PLAY</strong><small>NEW PAGE, SAME GOOD ENERGY</small>
          </motion.div>
        </motion.div>
      ) : null}
    </>
  );
}
