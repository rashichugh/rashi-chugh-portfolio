"use client";

import { motion } from "framer-motion";
import { ToyboxSticker, type StickerId } from "@/components/toybox-stickers";

const trails: Record<"home" | "about" | "contact", StickerId[]> = {
  home: ["party", "planet", "dice", "hello"],
  about: ["mushroom", "wink", "crown", "magic"],
  contact: ["sun", "eye", "hello", "party"],
};

export function StickerTrail({ scope }: { scope: keyof typeof trails }) {
  return (
    <div className={`sticker-trail sticker-trail-${scope}`} aria-hidden="true">
      {trails[scope].map((id, index) => (
        <motion.div key={id} className={`sticker-trail-item sticker-trail-item-${index + 1}`} animate={{ y: [0, -8, 0], rotate: [index % 2 ? 7 : -8, index % 2 ? 12 : -3, index % 2 ? 7 : -8] }} transition={{ duration: 4.2 + index * 0.55, repeat: Infinity, ease: "easeInOut" }}>
          <ToyboxSticker id={id} />
        </motion.div>
      ))}
    </div>
  );
}
