"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, RotateCw, Sparkles, Sticker, Volume2, X } from "lucide-react";
import { Component, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Reveal, usePrefersReducedMotion } from "@/components/motion";
import { useStickerCollection } from "@/components/sticker-collection";
import type { CapsuleCommand } from "@/components/capsule-scene";
import { allStickerIds, getStickerRarity, rollStickerBundle, stickerDefinitions, stickerRarityMeta, ToyboxSticker, type StickerId, type StickerRarity } from "@/components/toybox-stickers";

const CapsuleScene = dynamic(() => import("@/components/capsule-scene"), {
  ssr: false,
  loading: () => <div className="capsule-loading"><ToyboxSticker id="party" /><span>FILLING THE CAPSULE MACHINE…</span></div>,
});

class CapsuleErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (this.state.failed) return <div className="capsule-fallback"><ToyboxSticker id="party" /><strong>The pocket capsule machine.</strong><span>WebGL is unavailable, but lucky drops and the sticker drawer still work.</span></div>;
    return this.props.children;
  }
}

type ConfettiPiece = { id: number; x: number; y: number; dx: number; dy: number; rotate: number; color: string };
type RevealBatch = { id: number; variants: StickerId[] };
const confettiColors = ["#DDF48B", "#FF805C", "#AFC8FF", "#F3BAD1", "#FFCF54"];
const rarityRank: Record<StickerRarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };

export function InteractivePlayground() {
  const reducedMotion = usePrefersReducedMotion();
  const { history, inventory, totalCopies, unlockedCount, availableCopies, addStickers, setDrawerOpen } = useStickerCollection();
  const sectionRef = useRef<HTMLElement>(null);
  const commandId = useRef(0);
  const revealId = useRef(0);
  const confettiId = useRef(0);
  const confettiTimer = useRef(0);
  const fallbackTimer = useRef(0);
  const [sceneActive, setSceneActive] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [command, setCommand] = useState<CapsuleCommand | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<RevealBatch | null>(null);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const updateVisibility = () => {
      const bounds = section.getBoundingClientRect();
      const active = bounds.bottom > -180 && bounds.top < window.innerHeight + 180;
      setSceneActive(active);
      if (active) setHasEntered(true);
    };
    const frame = requestAnimationFrame(updateVisibility);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  useEffect(() => () => {
    window.clearTimeout(confettiTimer.current);
    window.clearTimeout(fallbackTimer.current);
  }, []);

  const burst = useCallback((amount: number) => {
    if (reducedMotion) return;
    setConfetti(Array.from({ length: 22 + amount * 6 }, (_, index) => ({
      id: confettiId.current++,
      x: 40 + Math.random() * 25,
      y: 30 + Math.random() * 24,
      dx: (Math.random() - 0.5) * 390,
      dy: (Math.random() - 0.65) * 300,
      rotate: Math.random() * 540 - 270,
      color: confettiColors[index % confettiColors.length],
    })));
    window.clearTimeout(confettiTimer.current);
    confettiTimer.current = window.setTimeout(() => setConfetti([]), 1150);
  }, [reducedMotion]);

  const completeReveal = useCallback((variants: StickerId[]) => {
    if (!variants.length) return;
    addStickers(variants);
    setRevealed({ id: ++revealId.current, variants });
    setBusy(false);
    burst(variants.length);
  }, [addStickers, burst]);

  const turnCrank = useCallback(() => {
    if (busy) return;
    const stage = sectionRef.current?.querySelector<HTMLElement>(".capsule-stage");
    if (stage && window.innerWidth <= 850) {
      const bounds = stage.getBoundingClientRect();
      if (bounds.top < 20 || bounds.bottom > window.innerHeight - 20) stage.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    }
    const variants = rollStickerBundle();
    setBusy(true);
    setRevealed(null);
    if (sceneFailed) fallbackTimer.current = window.setTimeout(() => completeReveal(variants), reducedMotion ? 100 : 550);
    else setCommand({ id: ++commandId.current, type: "dispense", variants });
  }, [busy, sceneFailed, reducedMotion, completeReveal]);

  const shakeMachine = useCallback(() => {
    if (busy || sceneFailed) return;
    setCommand({ id: ++commandId.current, type: "shake" });
  }, [busy, sceneFailed]);

  const onStageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === " " || event.key === "Enter") turnCrank();
    else if (event.key.toLowerCase() === "s") shakeMachine();
    else return;
    event.preventDefault();
  };

  const revealRarity = revealed?.variants.reduce<StickerRarity>((highest, id) => rarityRank[getStickerRarity(id)] > rarityRank[highest] ? getStickerRarity(id) : highest, "common") ?? "common";

  return (
    <section className="playground capsule-playground" id="sticker-machine" ref={sectionRef} aria-labelledby="playground-title">
      <div className="playground-grid" aria-hidden="true" />
      <div className="playground-inner section-pad">
        <Reveal className="playground-heading capsule-heading">
          <div>
            <p className="section-kicker light"><span>✳</span> RASHI’S STICKER CAPSULE CLUB</p>
            <h2 id="playground-title">Crank. Pop.<br /><em>Stick them everywhere.</em></h2>
          </div>
          <p>Jumping capsules, {allStickerIds.length} designs, four rarities and lucky multi-drops. Every copy you win can be dragged from your sticker drawer onto the page.</p>
        </Reveal>

        <div className="capsule-layout">
          <div className={`capsule-stage ${busy ? "is-dispensing" : ""}`} tabIndex={0} role="group" aria-label="Interactive 3D sticker capsule machine. Press Space to crank and S to make the inside capsules jump. Drag popped capsules to throw them." onKeyDown={onStageKeyDown}>
            <div className="capsule-stage-status"><span /> {sceneFailed ? "POCKET MODE" : busy ? "LUCKY DROP INCOMING…" : "THE CRANK IS READY"}</div>
            <span className="capsule-stage-count">{allStickerIds.length} DESIGNS · {unlockedCount} UNLOCKED</span>
            <div className="capsule-canvas-wrap">
              <CapsuleErrorBoundary onError={() => { setSceneFailed(true); setSceneReady(true); }}>
                {hasEntered ? (
                  <CapsuleScene active={sceneActive} reducedMotion={reducedMotion} command={command} onReady={() => setSceneReady(true)} onCrank={turnCrank} onReveal={completeReveal} />
                ) : <div className="capsule-loading"><ToyboxSticker id="party" /><span>THE MACHINE IS JUST BELOW…</span></div>}
              </CapsuleErrorBoundary>
            </div>
            {!sceneReady && hasEntered ? <div className="capsule-loading"><ToyboxSticker id="party" /><span>FILLING THE CAPSULE MACHINE…</span></div> : null}

            <AnimatePresence>
              {revealed ? (
                <motion.div className={`capsule-reveal rarity-${revealRarity} ${revealed.variants.length > 1 ? "is-multi" : ""}`} key={revealed.id} initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.45, rotate: -12, y: 40 }} animate={{ opacity: 1, scale: 1, rotate: revealed.variants.length > 1 ? 0 : -3, y: 0 }} exit={{ opacity: 0, scale: 0.75, y: -20 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
                  <button type="button" className="capsule-reveal-close" onClick={() => setRevealed(null)} aria-label="Close sticker reveal"><X size={15} /></button>
                  <span className="capsule-reveal-kicker"><Sparkles size={13} /> {revealed.variants.length > 1 ? `${revealed.variants.length}-STICKER LUCKY DROP!` : "YOU GOT ONE!"}</span>
                  <div className="capsule-reveal-stickers">
                    {revealed.variants.map((id, index) => {
                      const rarity = getStickerRarity(id);
                      return <div className={`capsule-reveal-sticker rarity-${rarity}`} key={`${id}-${index}`}><ToyboxSticker id={id} /><strong>{stickerDefinitions[id].label}</strong><small>{stickerRarityMeta[rarity].label}</small>{(inventory[id] ?? 0) > 1 ? <span>×{inventory[id]} collected</span> : null}</div>;
                    })}
                  </div>
                  <button type="button" className="capsule-place-button" onClick={() => setDrawerOpen(true)}><Sticker size={15} /> Place your stickers</button>
                  <span className="capsule-reveal-total">{totalCopies} {totalCopies === 1 ? "copy" : "copies"} in your stash · duplicates give you more to place</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <AnimatePresence>{confetti.map((piece) => <motion.span key={piece.id} className="capsule-confetti" style={{ left: `${piece.x}%`, top: `${piece.y}%`, background: piece.color }} initial={{ x: 0, y: 0, scale: 0, opacity: 1 }} animate={{ x: piece.dx, y: piece.dy, scale: 1, opacity: 0, rotate: piece.rotate }} transition={{ duration: 0.95, ease: "easeOut" }} aria-hidden="true" />)}</AnimatePresence>
            <div className="capsule-instructions" aria-hidden="true"><span>GRAB + THROW POPPED CAPSULES</span><i /><span>SPACE TO CRANK</span><i /><span>S TO SHAKE</span></div>
          </div>

          <aside className="capsule-panel" aria-label="Capsule machine controls">
            <div className="capsule-panel-stickers" aria-hidden="true"><ToyboxSticker id="holo-star" /><ToyboxSticker id="ufo" /></div>
            <span className="capsule-panel-kicker">THE STICKER MACHINE · EST. 2026</span>
            <h3>One crank.<br /><em>One lucky little drop.</em></h3>
            <p>Capsules jump and spin inside the jar. Outside, they are yours to grab and throw. Every drop has a chance at 2, 3 or 4 stickers.</p>
            <button type="button" className="capsule-crank-button" onClick={turnCrank} disabled={busy || (!sceneReady && !sceneFailed)}><RotateCw size={18} className={busy ? "is-spinning" : ""} />{busy ? "Lucky drop incoming…" : "Turn the crank"}<span>SPACE</span></button>
            <button type="button" className="capsule-shake-button" onClick={shakeMachine} disabled={busy || sceneFailed || !sceneReady}><Dices size={16} /> Shake the capsules <span>S</span></button>
            <div className="capsule-odds"><span>1 · 62%</span><span>2 · 26%</span><span>3 · 9%</span><span>4 · 3%</span></div>

            <div className="capsule-collection-heading"><span>LATEST DROPS</span><strong>{totalCopies} {totalCopies === 1 ? "COPY" : "COPIES"}</strong></div>
            <div className="capsule-collection">
              {Array.from({ length: 6 }, (_, index) => {
                const sticker = history[index];
                return sticker ? <button className={`rarity-${getStickerRarity(sticker)}`} key={`${sticker}-${index}`} type="button" onClick={() => setRevealed({ id: ++revealId.current, variants: [sticker] })} aria-label={`View ${stickerDefinitions[sticker].label} sticker`}><ToyboxSticker id={sticker} />{(inventory[sticker] ?? 0) > 1 ? <span>×{inventory[sticker]}</span> : null}</button> : <span className="capsule-empty-slot" key={index}>?</span>;
              })}
            </div>
            <button type="button" className="capsule-open-drawer" onClick={() => setDrawerOpen(true)}><Sticker size={16} /><span>Open sticker drawer</span><strong>{availableCopies} ready</strong></button>
            <div className="capsule-collection-footer"><span>{unlockedCount} / {allStickerIds.length} unlocked · locked designs stay mysterious in your album.</span></div>
            <div className="capsule-sound-note"><Volume2 size={14} /><span>No sound. Just very satisfying little movements.</span></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
