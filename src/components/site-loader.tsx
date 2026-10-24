"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, type PointerEvent } from "react";
import { usePrefersReducedMotion } from "@/components/motion";
import { StickerArt } from "@/components/sticker-art";

const LOADER_KEY = "rashi-playful-loader-v2-seen";
const roles = ["GRAPHIC DESIGNER", "VIDEO EDITOR", "MOTION DESIGNER"];

export function SiteLoader() {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(true);
  const [roleIndex, setRoleIndex] = useState(0);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 170, damping: 22 });
  const smoothY = useSpring(pointerY, { stiffness: 170, damping: 22 });
  const nameX = useTransform(smoothX, (value) => value * 14);
  const nameY = useTransform(smoothY, (value) => value * 10);
  const stickerOneX = useTransform(smoothX, (value) => value * 42);
  const stickerOneY = useTransform(smoothY, (value) => value * 30);
  const stickerTwoX = useTransform(smoothX, (value) => value * -34);
  const stickerTwoY = useTransform(smoothY, (value) => value * -26);
  const stickerThreeX = useTransform(smoothX, (value) => value * 24);
  const stickerThreeY = useTransform(smoothY, (value) => value * -38);

  useEffect(() => {
    if (sessionStorage.getItem(LOADER_KEY)) {
      const seenTimer = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(seenTimer);
    }
    const started = performance.now();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let finished = false;
    let exitTimer = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      const remaining = Math.max(0, 3000 - (performance.now() - started));
      exitTimer = window.setTimeout(() => {
        sessionStorage.setItem(LOADER_KEY, "1");
        document.body.style.overflow = previousOverflow;
        setVisible(false);
      }, remaining);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    const safetyTimer = window.setTimeout(finish, 4500);
    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(safetyTimer);
      window.clearTimeout(exitTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || !visible) return;
    const interval = window.setInterval(() => setRoleIndex((current) => (current + 1) % roles.length), 950);
    return () => window.clearInterval(interval);
  }, [reducedMotion, visible]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="site-loader"
          role="status"
          aria-label="Loading Rashi Chugh’s portfolio"
          onPointerMove={onPointerMove}
          onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}
          exit={reducedMotion ? { opacity: 0 } : { y: "-100%" }}
          transition={{ duration: reducedMotion ? 0.2 : 0.78, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div className="loader-echo" aria-hidden="true" initial={reducedMotion ? false : { x: "-8%" }} animate={reducedMotion ? undefined : { x: "8%" }} transition={{ duration: 3, ease: "linear" }}>PLAY · MAKE · REPEAT · PLAY · MAKE · REPEAT</motion.div>
          <motion.div className="loader-sticker loader-sticker-one" style={{ x: stickerOneX, y: stickerOneY }} animate={reducedMotion ? undefined : { rotate: [8, -5, 8] }} transition={{ duration: 2.2, repeat: Infinity }}><StickerArt variant="smiley" /></motion.div>
          <motion.div className="loader-sticker loader-sticker-two" style={{ x: stickerTwoX, y: stickerTwoY }} animate={reducedMotion ? undefined : { rotate: [-12, 8, -12] }} transition={{ duration: 2.6, repeat: Infinity }}><StickerArt variant="wow" /></motion.div>
          <motion.div className="loader-sticker loader-sticker-three" style={{ x: stickerThreeX, y: stickerThreeY }} animate={reducedMotion ? undefined : { rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: "linear" }}><StickerArt variant="spark" /></motion.div>

          <motion.div className="loader-center" style={{ x: nameX, y: nameY }}>
            <motion.div className="loader-mark" initial={reducedMotion ? false : { scale: 0.7, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 15 }}>✳</motion.div>
            <div className="loader-name" aria-label="Rashi">
              {"RASHI".split("").map((letter, index) => (
                <span className="loader-letter-mask" key={`${letter}-${index}`} aria-hidden="true">
                  <motion.span
                    className="loader-letter"
                    initial={reducedMotion ? false : { y: "115%", rotate: 8 }}
                    animate={{ y: 0, rotate: 0 }}
                    whileHover={reducedMotion ? undefined : { y: -17, rotate: index % 2 ? 7 : -7, color: "#FF805C", transition: { duration: 0.18, delay: 0 } }}
                    whileTap={reducedMotion ? undefined : { scale: 0.86, transition: { duration: 0.12, delay: 0 } }}
                    transition={{ delay: reducedMotion ? 0 : 0.12 + index * 0.085, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                  >{letter}</motion.span>
                </span>
              ))}
              <motion.sup initial={reducedMotion ? false : { opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, type: "spring" }} aria-hidden="true">®</motion.sup>
            </div>
            <div className="loader-role">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={roleIndex} initial={reducedMotion ? false : { y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reducedMotion ? { opacity: 0 } : { y: -18, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.32 }}>{roles[roleIndex]}</motion.p>
              </AnimatePresence>
            </div>
            <motion.span className="loader-tagline" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}>MAKING IDEAS LOOK ALIVE</motion.span>
          </motion.div>

          <span className="loader-interaction-note">MOVE YOUR CURSOR · TICKLE THE LETTERS</span>
          <div className="loader-progress-row">
            <span>LOADING A LITTLE FUN</span>
            <div className="loader-progress"><motion.span initial={reducedMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reducedMotion ? 0 : 2.85, ease: "linear" }} /></div>
            <span>©26</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
