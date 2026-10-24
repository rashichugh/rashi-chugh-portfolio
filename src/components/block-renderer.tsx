"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomVideoPlayer } from "@/components/custom-video-player";
import { embedUrl, isVideoUrl, safeRichText } from "@/lib/utils";
import type { ContentBlock } from "@/types/content";

function strings(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function VideoFrame({ url, poster, title }: { url: string; poster: string; title: string }) {
  if (!isVideoUrl(url) && !url.startsWith("/")) {
    return <div className="video-frame"><iframe src={embedUrl(url)} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>;
  }
  return <CustomVideoPlayer url={url} poster={poster} title={title} />;
}

export function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const openImage = (src: string, caption = "") => setLightbox({ src, caption });

  return (
    <div className="blocks-renderer">
      {blocks.filter((block) => !block.hidden).map((block) => {
        const data = block.data;
        switch (block.type) {
          case "heading": {
            const level = Math.min(4, Math.max(2, Number(data.level ?? 2)));
            const Tag = `h${level}` as "h2" | "h3" | "h4";
            return <Tag className="content-heading" key={block.id}>{String(data.text ?? "")}</Tag>;
          }
          case "paragraph":
            return <div className="content-paragraph" key={block.id} dangerouslySetInnerHTML={{ __html: safeRichText(String(data.html ?? "")) }} />;
          case "image": {
            const src = String(data.url ?? "");
            if (!src) return null;
            const caption = String(data.caption ?? "");
            return (
              <figure className={`content-image image-${String(data.width ?? "wide")}`} key={block.id}>
                <button onClick={() => openImage(src, caption)} data-cursor="ZOOM"><img src={src} alt={caption || "Project artwork"} loading="lazy" /><span><ZoomIn size={18} /></span></button>
                {caption ? <figcaption>{caption}</figcaption> : null}
              </figure>
            );
          }
          case "gallery": {
            const images = strings(data.images);
            const captions = strings(data.captions);
            return (
              <div className={`content-gallery gallery-${String(data.layout ?? "grid")}`} key={block.id}>
                {images.map((src, index) => (
                  <figure key={`${src}-${index}`}>
                    <button onClick={() => openImage(src, captions[index] ?? "")} data-cursor="ZOOM"><img src={src} alt={captions[index] || `Project artwork ${index + 1}`} loading="lazy" /><span><ZoomIn size={17} /></span></button>
                    {captions[index] ? <figcaption>{captions[index]}</figcaption> : null}
                  </figure>
                ))}
              </div>
            );
          }
          case "video": {
            const url = String(data.url ?? "");
            if (!url) return null;
            const caption = String(data.caption ?? "");
            return (
              <figure className="content-video" key={block.id}>
                <VideoFrame url={url} poster={String(data.poster ?? "")} title={caption || "Project video"} />
                {caption ? <figcaption>{caption}</figcaption> : null}
              </figure>
            );
          }
          case "quote":
            return <blockquote className="content-quote" key={block.id}><span>“</span><p>{String(data.text ?? "")}</p>{data.author ? <cite>— {String(data.author)}</cite> : null}</blockquote>;
          case "callout":
            return <aside className={`content-callout tone-${String(data.tone ?? "lime")}`} key={block.id}><span>✳</span><p>{String(data.text ?? "")}</p></aside>;
          case "list": {
            const items = strings(data.items);
            const Tag = data.ordered ? "ol" : "ul";
            return <Tag className="content-list" key={block.id}>{items.map((item, index) => <li key={index}>{item}</li>)}</Tag>;
          }
          case "divider":
            return <div className="content-divider" key={block.id}><span>✳</span></div>;
          case "link":
            return <a className="content-link" key={block.id} href={String(data.url ?? "#")} target="_blank" rel="noreferrer">{String(data.label ?? "View link")}<ArrowUpRight /></a>;
          case "columns":
            return (
              <div className="content-columns" key={block.id}>
                <div className="content-paragraph" dangerouslySetInnerHTML={{ __html: safeRichText(String(data.left ?? "")) }} />
                <div className="content-paragraph" dangerouslySetInnerHTML={{ __html: safeRichText(String(data.right ?? "")) }} />
              </div>
            );
          default:
            return null;
        }
      })}
      <AnimatePresence>
        {lightbox ? (
          <motion.div className="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onClick={() => setLightbox(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close image preview"><X /></button>
            <motion.figure onClick={(event) => event.stopPropagation()} initial={{ scale: 0.94, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}>
              <img src={lightbox.src} alt={lightbox.caption || "Expanded project artwork"} />
              {lightbox.caption ? <figcaption>{lightbox.caption}</figcaption> : null}
            </motion.figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
