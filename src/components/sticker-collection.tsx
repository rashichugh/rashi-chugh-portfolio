"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { allStickerIds, type StickerId } from "@/components/toybox-stickers";

const COLLECTION_KEY = "rashi-sticker-capsule-inventory-v2";
const HISTORY_KEY = "rashi-sticker-capsule-history-v2";
const PLACEMENTS_KEY = "rashi-sticker-page-placements-v1";
const LEGACY_KEY = "rashi-sticker-capsule-collection-v1";

type Inventory = Partial<Record<StickerId, number>>;
export type PlacedSticker = { instanceId: string; stickerId: StickerId; x: number; y: number; rotation: number };
type PlacementMap = Record<string, PlacedSticker[]>;

type StickerCollectionValue = {
  inventory: Inventory;
  history: StickerId[];
  currentPlacements: PlacedSticker[];
  drawerOpen: boolean;
  totalCopies: number;
  unlockedCount: number;
  availableCopies: number;
  setDrawerOpen: (open: boolean) => void;
  addStickers: (ids: StickerId[]) => void;
  available: (id: StickerId) => number;
  placeSticker: (id: StickerId, x: number, y: number) => boolean;
  moveSticker: (instanceId: string, x: number, y: number) => void;
  rotateSticker: (instanceId: string, rotation: number) => void;
  returnSticker: (instanceId: string) => void;
  resetCollection: () => void;
};

const StickerCollectionContext = createContext<StickerCollectionValue | null>(null);
const validId = (value: unknown): value is StickerId => typeof value === "string" && allStickerIds.includes(value as StickerId);

function normalizeInventory(value: unknown): Inventory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Inventory = {};
  for (const [id, count] of Object.entries(value)) {
    if (validId(id) && typeof count === "number" && Number.isFinite(count) && count > 0) result[id] = Math.min(9999, Math.floor(count));
  }
  return result;
}

function normalizeHistory(value: unknown): StickerId[] {
  return Array.isArray(value) ? value.filter(validId).slice(0, 24) : [];
}

function normalizePlacements(value: unknown): PlacementMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: PlacementMap = {};
  for (const [path, items] of Object.entries(value)) {
    if (!path.startsWith("/") || !Array.isArray(items)) continue;
    result[path] = items.flatMap((item): PlacedSticker[] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<PlacedSticker>;
      if (!validId(candidate.stickerId) || typeof candidate.instanceId !== "string" || typeof candidate.x !== "number" || typeof candidate.y !== "number") return [];
      if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) return [];
      return [{ instanceId: candidate.instanceId, stickerId: candidate.stickerId, x: candidate.x, y: candidate.y, rotation: typeof candidate.rotation === "number" && Number.isFinite(candidate.rotation) ? candidate.rotation : 0 }];
    });
  }
  return result;
}

export function StickerCollectionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const ready = useRef(false);
  const [inventory, setInventory] = useState<Inventory>({});
  const [history, setHistory] = useState<StickerId[]>([]);
  const [placements, setPlacements] = useState<PlacementMap>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const savedInventory = localStorage.getItem(COLLECTION_KEY);
        const legacy = normalizeHistory(JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "[]"));
        const migrated: Inventory = {};
        legacy.forEach((id) => { migrated[id] = (migrated[id] ?? 0) + 1; });
        setInventory(savedInventory ? normalizeInventory(JSON.parse(savedInventory)) : migrated);
        setHistory(normalizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")).length ? normalizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")) : legacy);
        setPlacements(normalizePlacements(JSON.parse(localStorage.getItem(PLACEMENTS_KEY) ?? "{}")));
      } catch {
        setInventory({});
        setHistory([]);
        setPlacements({});
      }
      ready.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => { if (ready.current) localStorage.setItem(COLLECTION_KEY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { if (ready.current) localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }, [history]);
  useEffect(() => { if (ready.current) localStorage.setItem(PLACEMENTS_KEY, JSON.stringify(placements)); }, [placements]);

  const addStickers = useCallback((ids: StickerId[]) => {
    if (!ids.length) return;
    setInventory((current) => {
      const next = { ...current };
      ids.forEach((id) => { next[id] = (next[id] ?? 0) + 1; });
      return next;
    });
    setHistory((current) => [...ids, ...current].slice(0, 24));
  }, []);

  const placedCount = useCallback((id: StickerId, map: PlacementMap = placements) => Object.values(map).flat().filter((item) => item.stickerId === id).length, [placements]);
  const available = useCallback((id: StickerId) => Math.max(0, (inventory[id] ?? 0) - placedCount(id)), [inventory, placedCount]);

  const placeSticker = useCallback((id: StickerId, x: number, y: number) => {
    if (available(id) <= 0) return false;
    const item: PlacedSticker = { instanceId: crypto.randomUUID(), stickerId: id, x, y, rotation: Math.round((Math.random() - 0.5) * 20) };
    setPlacements((current) => ({ ...current, [pathname]: [...(current[pathname] ?? []), item] }));
    return true;
  }, [available, pathname]);

  const moveSticker = useCallback((instanceId: string, x: number, y: number) => {
    setPlacements((current) => ({ ...current, [pathname]: (current[pathname] ?? []).map((item) => item.instanceId === instanceId ? { ...item, x, y } : item) }));
  }, [pathname]);

  const rotateSticker = useCallback((instanceId: string, rotation: number) => {
    const normalized = ((rotation % 360) + 360) % 360;
    setPlacements((current) => ({ ...current, [pathname]: (current[pathname] ?? []).map((item) => item.instanceId === instanceId ? { ...item, rotation: normalized } : item) }));
  }, [pathname]);

  const returnSticker = useCallback((instanceId: string) => {
    setPlacements((current) => {
      const next: PlacementMap = {};
      Object.entries(current).forEach(([path, items]) => { next[path] = items.filter((item) => item.instanceId !== instanceId); });
      return next;
    });
  }, []);

  const resetCollection = useCallback(() => {
    setInventory({});
    setHistory([]);
    setPlacements({});
    try { localStorage.removeItem(LEGACY_KEY); } catch { /* Storage can be unavailable in private contexts. */ }
  }, []);

  const totalCopies = Object.values(inventory).reduce((sum, count) => sum + (count ?? 0), 0);
  const unlockedCount = allStickerIds.filter((id) => (inventory[id] ?? 0) > 0).length;
  const availableCopies = allStickerIds.reduce((sum, id) => sum + available(id), 0);

  return (
    <StickerCollectionContext.Provider value={{
      inventory,
      history,
      currentPlacements: placements[pathname] ?? [],
      drawerOpen,
      totalCopies,
      unlockedCount,
      availableCopies,
      setDrawerOpen,
      addStickers,
      available,
      placeSticker,
      moveSticker,
      rotateSticker,
      returnSticker,
      resetCollection,
    }}>
      {children}
    </StickerCollectionContext.Provider>
  );
}

export function useStickerCollection() {
  const value = useContext(StickerCollectionContext);
  if (!value) throw new Error("useStickerCollection must be used inside StickerCollectionProvider.");
  return value;
}
