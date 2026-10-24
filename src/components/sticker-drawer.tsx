"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, LockKeyhole, MousePointer2, RotateCcw, RotateCw, Sticker, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useStickerCollection, type PlacedSticker } from "@/components/sticker-collection";
import { useDialog } from "@/components/dialog";
import { allStickerIds, getStickerRarity, stickerDefinitions, stickerRarityMeta, ToyboxSticker, type StickerId, type StickerRarity } from "@/components/toybox-stickers";

type DragState = { source: "new" | "placed"; stickerId: StickerId; placementId?: string; x: number; y: number; startX: number; startY: number; rotation: number };
type RotateDragState = { placementId: string; pointerId: number; centerX: number; centerY: number; lastAngle: number; rotation: number };
type AlbumFilter = "all" | StickerRarity;
const filters: Array<{ id: AlbumFilter; label: string }> = [{ id: "all", label: "All" }, { id: "common", label: "Common" }, { id: "rare", label: "Rare" }, { id: "epic", label: "Epic" }, { id: "legendary", label: "Legendary" }];

function clampDrop(x: number, y: number) {
  const root = document.documentElement;
  return { x: Math.min(Math.max(30, x), Math.max(30, root.scrollWidth - 30)), y: Math.min(Math.max(30, y), Math.max(30, root.scrollHeight - 30)) };
}

export function StickerDrawer() {
  const pathname = usePathname() || "/";
  const { showConfirm } = useDialog();
  const { inventory, currentPlacements, drawerOpen, setDrawerOpen, unlockedCount, totalCopies, availableCopies, available, placeSticker, moveSticker, rotateSticker, returnSticker, resetCollection } = useStickerCollection();
  const [filter, setFilter] = useState<AlbumFilter>("all");
  const [drag, setDrag] = useState<DragState | null>(null);
  const [rotate, setRotate] = useState<RotateDragState | null>(null);
  const [hint, setHint] = useState("Drag an unlocked sticker anywhere on this page.");
  const dragRef = useRef<DragState | null>(null);
  const rotateRef = useRef<RotateDragState | null>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const beginDrag = useCallback((event: ReactPointerEvent<HTMLElement>, source: DragState["source"], stickerId: StickerId, placed?: PlacedSticker) => {
    if (event.button !== 0 || (source === "new" && available(stickerId) <= 0)) {
      if (source === "new" && (inventory[stickerId] ?? 0) > 0) setHint("Every copy is placed. Drag one back to the drawer to reuse it.");
      return;
    }
    event.preventDefault();
    const next = { source, stickerId, placementId: placed?.instanceId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, rotation: placed?.rotation ?? 0 };
    dragRef.current = next;
    setDrag(next);
    setHint(source === "new" ? "Drop outside the drawer to use one copy." : drawerOpen ? "Move it, or drop it back here to return the copy." : "Drag to move it, or tap for rotate and remove controls.");
  }, [available, drawerOpen, inventory]);

  const beginRotate = useCallback((event: ReactPointerEvent<HTMLButtonElement>, placed: PlacedSticker) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = event.currentTarget.closest(".placed-page-sticker")?.getBoundingClientRect();
    if (!bounds) return;
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const next = {
      placementId: placed.instanceId,
      pointerId: event.pointerId,
      centerX,
      centerY,
      lastAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
      rotation: placed.rotation,
    };
    rotateRef.current = next;
    setRotate(next);
    setHint("Drag around the sticker to rotate. Release to save.");
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      event.preventDefault();
      const next = { ...dragRef.current, x: event.clientX, y: event.clientY };
      dragRef.current = next;
      setDrag(next);
    };
    const finish = (event: PointerEvent, cancelled = false) => {
      const current = dragRef.current;
      if (!current) return;
      dragRef.current = null;
      setDrag(null);
      if (cancelled) { setHint("Drag an unlocked sticker anywhere on this page."); return; }
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const overDrawer = Boolean(target?.closest("[data-sticker-drawer]"));
      const overInterface = Boolean(target?.closest("[data-sticker-toggle], .site-header, .admin-dock, .save-indicator, .lightbox"));
      const wasTap = Math.hypot(current.x - current.startX, current.y - current.startY) < 6;
      if (current.source === "placed" && current.placementId) {
        if (wasTap && !overDrawer && !overInterface) {
          target?.closest<HTMLElement>(".placed-page-sticker")?.focus({ preventScroll: true });
          setHint("Drag the rotate handle around the sticker, or use × to return the copy.");
        } else if (overDrawer) {
          returnSticker(current.placementId);
          setHint("Copy returned. It is ready to place again.");
        } else if (!overInterface) {
          const point = clampDrop(event.clientX, event.clientY + window.scrollY);
          moveSticker(current.placementId, point.x, point.y);
          setHint("Placement saved on this page.");
        }
      } else if (current.source === "new" && !overDrawer && !overInterface) {
        const point = clampDrop(event.clientX, event.clientY + window.scrollY);
        if (placeSticker(current.stickerId, point.x, point.y)) setHint(`Placed one ${stickerDefinitions[current.stickerId].label}. ${Math.max(0, available(current.stickerId) - 1)} left to place.`);
      }
    };
    const onUp = (event: PointerEvent) => finish(event);
    const onCancel = (event: PointerEvent) => finish(event, true);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [available, moveSticker, placeSticker, returnSticker]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const current = rotateRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      event.preventDefault();
      const angle = Math.atan2(event.clientY - current.centerY, event.clientX - current.centerX) * 180 / Math.PI;
      let delta = angle - current.lastAngle;
      if (delta > 180) delta -= 360;
      else if (delta < -180) delta += 360;
      const next = { ...current, lastAngle: angle, rotation: current.rotation + delta };
      rotateRef.current = next;
      setRotate(next);
    };
    const finish = (event: PointerEvent, cancelled = false) => {
      const current = rotateRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      rotateRef.current = null;
      setRotate(null);
      if (cancelled) { setHint("Rotation unchanged."); return; }
      rotateSticker(current.placementId, current.rotation);
      setHint("Rotation saved on this page.");
    };
    const onUp = (event: PointerEvent) => finish(event);
    const onCancel = (event: PointerEvent) => finish(event, true);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [rotateSticker]);

  const quickPlace = (id: StickerId) => {
    const point = clampDrop(window.innerWidth * 0.5, window.scrollY + window.innerHeight * 0.48);
    if (placeSticker(id, point.x, point.y)) setHint(`Placed one ${stickerDefinitions[id].label} near the center of your screen.`);
  };

  if (pathname.startsWith("/auth")) return null;
  const visibleStickers = allStickerIds.filter((id) => filter === "all" || getStickerRarity(id) === filter);

  return (
    <>
      <div className={`sticker-placement-layer ${drawerOpen ? "is-arranging" : ""}`} aria-label="Your placed page stickers">
        {currentPlacements.map((placed) => (
          <div
            className={`placed-page-sticker rarity-${getStickerRarity(placed.stickerId)} ${drag?.placementId === placed.instanceId ? "is-dragging" : ""} ${rotate?.placementId === placed.instanceId ? "is-rotating" : ""}`}
            key={placed.instanceId}
            style={{ left: placed.x, top: placed.y, transform: "translate(-50%, -50%)" }}
            onPointerDown={(event) => beginDrag(event, "placed", placed.stickerId, placed)}
            data-cursor="MOVE"
            role="group"
            tabIndex={0}
            aria-label={`${stickerDefinitions[placed.stickerId].label} placed sticker. Drag to move, or use the rotate and remove controls.`}
          >
            <div className="placed-sticker-art" style={{ transform: `rotate(${rotate?.placementId === placed.instanceId ? rotate.rotation : placed.rotation}deg)` }}><ToyboxSticker id={placed.stickerId} /></div>
            <button
              type="button"
              className="placed-sticker-rotate"
              data-cursor="ROTATE"
              aria-label={`Drag to rotate ${stickerDefinitions[placed.stickerId].label}; arrow keys rotate in 15 degree steps`}
              title="Drag around the sticker to rotate"
              onPointerDown={(event) => beginRotate(event, placed)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                rotateSticker(placed.instanceId, placed.rotation + (event.key === "ArrowRight" ? 15 : -15));
                setHint("Rotation saved on this page.");
              }}
            ><RotateCw size={14} /></button>
            <button type="button" className="placed-sticker-remove" data-cursor="REMOVE" aria-label={`Remove ${stickerDefinitions[placed.stickerId].label} from this page and return it to the drawer`} onPointerDown={(event) => event.stopPropagation()} onClick={() => { returnSticker(placed.instanceId); setHint("Copy returned to your drawer."); }}><X size={12} /></button>
          </div>
        ))}
      </div>

      <button type="button" className={`sticker-drawer-toggle ${drawerOpen ? "is-open" : ""}`} onClick={() => setDrawerOpen(!drawerOpen)} aria-expanded={drawerOpen} aria-controls="sticker-drawer" data-sticker-toggle data-cursor="STICKERS">
        <Sticker size={17} /><span>Sticker drawer</span>{availableCopies > 0 ? <strong>{availableCopies}</strong> : null}
      </button>

      <AnimatePresence>
        {drawerOpen ? (
          <motion.aside
            id="sticker-drawer"
            className="sticker-drawer"
            data-sticker-drawer
            ref={drawerRef}
            role="dialog"
            aria-label="Sticker collection and placement drawer"
            initial={{ opacity: 0, x: 35, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 25, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <div className="sticker-drawer-heading">
              <div><span>YOUR CAPSULE COLLECTION</span><h2>Stick, move,<br /><em>make it yours.</em></h2></div>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close sticker drawer"><X size={18} /></button>
            </div>
            <div className="sticker-drawer-stats"><span><strong>{unlockedCount}</strong> / {allStickerIds.length} unlocked</span><span><strong>{totalCopies}</strong> copies</span><span><strong>{availableCopies}</strong> ready</span></div>
            <div className="sticker-drawer-filters" role="group" aria-label="Filter stickers by rarity">
              {filters.map((item) => <button type="button" key={item.id} className={filter === item.id ? "active" : ""} onClick={() => setFilter(item.id)} aria-pressed={filter === item.id}>{item.label}</button>)}
            </div>
            <div className="sticker-album" aria-live="polite">
              {visibleStickers.map((id) => {
                const count = inventory[id] ?? 0;
                const free = available(id);
                const rarity = getStickerRarity(id);
                return (
                  <button
                    type="button"
                    className={`sticker-album-card rarity-${rarity} ${count ? "is-unlocked" : "is-locked"} ${free ? "has-available" : ""}`}
                    key={id}
                    onPointerDown={(event) => beginDrag(event, "new", id)}
                    onClick={(event) => { if (event.detail === 0 && free > 0) quickPlace(id); }}
                    aria-label={count ? `${stickerDefinitions[id].label}, ${stickerRarityMeta[rarity].label}, ${count} collected, ${free} available to place` : `Locked ${stickerRarityMeta[rarity].label} sticker`}
                    data-cursor={free ? "DRAG" : undefined}
                  >
                    <span className="sticker-album-art"><ToyboxSticker id={id} />{!count ? <i><LockKeyhole size={14} />?</i> : null}</span>
                    <span className="sticker-album-name">{count ? stickerDefinitions[id].label : "Mystery sticker"}</span>
                    <span className="sticker-album-meta"><small>{stickerRarityMeta[rarity].label}</small>{count ? <strong>×{count}</strong> : null}</span>
                    {count ? <span className={`sticker-album-availability ${free ? "" : "all-placed"}`}>{free ? `${free} to place` : "All placed"}</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="sticker-drawer-hint"><MousePointer2 size={15} /><p>{hint}</p></div>
            <div className="sticker-drawer-footer">
              <Link href="/#sticker-machine" onClick={() => setDrawerOpen(false)}><ArrowDownLeft size={14} /> Get more capsules</Link>
              {totalCopies ? <button type="button" onClick={async () => {
                const confirmed = await showConfirm({ title: "Reset your sticker collection?", message: "Every unlocked sticker and every placed sticker on this browser will be removed. The capsule machine will be ready for a fresh start.", confirmLabel: "Reset collection", danger: true });
                if (confirmed) { resetCollection(); setHint("Collection reset. The machine is ready for a fresh start."); }
              }}><RotateCcw size={13} /> Reset</button> : null}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {drag ? <motion.div className={`sticker-drag-ghost rarity-${getStickerRarity(drag.stickerId)}`} style={{ left: drag.x, top: drag.y }} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}><ToyboxSticker id={drag.stickerId} /><span>{drag.source === "new" ? "DROP TO PLACE" : drawerOpen ? "MOVE OR RETURN" : "DRAG TO MOVE"}</span></motion.div> : null}
      </AnimatePresence>
    </>
  );
}
