"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft, Bold, ChevronDown, ChevronUp, Columns2, Copy, Eye, EyeOff, GripVertical,
  Heading2, Image as ImageIcon, Images, Info, Italic, Link2, List, LoaderCircle,
  MessageSquareQuote, Minus, Plus, Quote, Trash2, Underline, Video, X,
} from "lucide-react";
import { useRef, useState } from "react";
import { cryptoId } from "@/lib/default-content";
import { uploadMedia } from "@/lib/demo-store";
import { cn } from "@/lib/utils";
import { useDialog } from "@/components/dialog";
import type { BlockType, ContentBlock } from "@/types/content";
import { MediaField } from "./media-field";

const blockDefinitions: Array<{ type: BlockType; label: string; icon: typeof AlignLeft }> = [
  { type: "heading", label: "Heading", icon: Heading2 },
  { type: "paragraph", label: "Rich text", icon: AlignLeft },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "gallery", label: "Gallery", icon: Images },
  { type: "video", label: "Video / embed", icon: Video },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "callout", label: "Callout", icon: Info },
  { type: "list", label: "List", icon: List },
  { type: "columns", label: "Two columns", icon: Columns2 },
  { type: "link", label: "Button link", icon: Link2 },
  { type: "divider", label: "Divider", icon: Minus },
];

function newBlock(type: BlockType): ContentBlock {
  const id = cryptoId();
  const defaults: Record<BlockType, Record<string, unknown>> = {
    heading: { text: "A new section", level: 2 },
    paragraph: { html: "Write the story behind this part of the project." },
    image: { url: "", caption: "", width: "wide" },
    gallery: { images: [], captions: [], layout: "grid" },
    video: { url: "", caption: "", poster: "" },
    quote: { text: "A thought worth remembering.", author: "" },
    callout: { text: "Highlight an important detail here.", tone: "lime" },
    list: { items: ["First point", "Second point"], ordered: false },
    columns: { left: "Left column text", right: "Right column text" },
    link: { label: "View project", url: "https://" },
    divider: {},
  };
  return { id, type, data: defaults[type] };
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function RichTextField({ value, onChange, label }: { value: string; onChange: (html: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const format = (command: string, argument?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, argument);
    if (ref.current) onChange(ref.current.innerHTML);
  };
  return (
    <div className="rich-text-field">
      <div className="rich-toolbar">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); format("bold"); }} aria-label="Bold"><Bold size={14} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); format("italic"); }} aria-label="Italic"><Italic size={14} /></button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); format("underline"); }} aria-label="Underline"><Underline size={14} /></button>
        <button type="button" onMouseDown={(e) => {
          e.preventDefault();
          const url = window.prompt("Link URL");
          if (url) format("createLink", url);
        }} aria-label="Add link"><Link2 size={14} /></button>
        <span>Rich text</span>
      </div>
      <div
        ref={ref}
        className="rich-text-input"
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value }}
        aria-label={label}
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="editor-field"><span>{label}</span>{children}</label>;
}

function GalleryEditor({ block, update, isDemo }: { block: ContentBlock; update: (data: Record<string, unknown>) => void; isDemo: boolean }) {
  const { showAlert } = useDialog();
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageLink, setImageLink] = useState("");
  const images = list(block.data.images);
  const captions = list(block.data.captions);
  const setImages = (next: string[], nextCaptions = captions) => update({ images: next, captions: nextCaptions });

  return (
    <div className="gallery-editor">
      <div className="field-label-row">
        <label>Gallery images · {images.length}</label>
        <div className="gallery-add-actions">
          <button type="button" className="gallery-link-toggle" onClick={() => setLinkOpen(!linkOpen)}><Link2 size={14} /> Add link</button>
          <label className={`upload-button ${uploading ? "disabled" : ""}`}>
            {uploading ? <LoaderCircle className="spin" size={14} /> : <Plus size={14} />}{uploading ? "Uploading" : "Upload"}
            <input type="file" accept="image/*" multiple disabled={uploading} onChange={async (event) => {
              const files = Array.from(event.target.files ?? []);
              if (!files.length) return;
              setUploading(true);
              try {
                const uploaded: string[] = [];
                for (const file of files) uploaded.push(await uploadMedia(file, isDemo));
                setImages([...images, ...uploaded], [...captions, ...uploaded.map(() => "")]);
              } catch (error) {
                await showAlert({ title: "Gallery upload failed", message: error instanceof Error ? error.message : "Upload failed", danger: true });
              } finally {
                setUploading(false);
                event.target.value = "";
              }
            }} />
          </label>
        </div>
      </div>
      {linkOpen ? (
        <form className="gallery-link-form" onSubmit={(event) => {
          event.preventDefault();
          const url = imageLink.trim();
          if (!url) return;
          setImages([...images, url], [...captions, ""]);
          setImageLink("");
          setLinkOpen(false);
        }}>
          <input autoFocus value={imageLink} onChange={(event) => setImageLink(event.target.value)} placeholder="Paste a direct image URL or /local/path" aria-label="Gallery image URL" />
          <button type="submit">Add image</button>
        </form>
      ) : null}
      <Field label="Layout"><select value={String(block.data.layout ?? "grid")} onChange={(e) => update({ layout: e.target.value })}><option value="grid">Even grid</option><option value="masonry">Editorial masonry</option></select></Field>
      <div className="gallery-editor-list">
        {images.map((src, index) => (
          <div className="gallery-editor-item" key={`${index}-${src.slice(0, 30)}`}>
            <img src={src} alt="" />
            <div>
              <input value={src} onChange={(e) => setImages(images.map((item, i) => i === index ? e.target.value : item))} aria-label={`Image ${index + 1} URL`} />
              <input value={captions[index] ?? ""} onChange={(e) => {
                const next = [...captions];
                while (next.length < images.length) next.push("");
                next[index] = e.target.value;
                update({ captions: next });
              }} placeholder="Caption (optional)" aria-label={`Image ${index + 1} caption`} />
            </div>
            <button type="button" onClick={() => setImages(images.filter((_, i) => i !== index), captions.filter((_, i) => i !== index))} aria-label="Remove image"><X size={16} /></button>
          </div>
        ))}
      </div>
      {!images.length ? <div className="editor-empty">Add images to build a gallery.</div> : null}
    </div>
  );
}

function BlockFields({ block, update, isDemo }: { block: ContentBlock; update: (data: Record<string, unknown>) => void; isDemo: boolean }) {
  const data = block.data;
  switch (block.type) {
    case "heading":
      return <div className="editor-two-col"><Field label="Heading"><input value={String(data.text ?? "")} onChange={(e) => update({ text: e.target.value })} /></Field><Field label="Level"><select value={Number(data.level ?? 2)} onChange={(e) => update({ level: Number(e.target.value) })}><option value={2}>Large · H2</option><option value={3}>Medium · H3</option><option value={4}>Small · H4</option></select></Field></div>;
    case "paragraph":
      return <RichTextField value={String(data.html ?? "")} onChange={(html) => update({ html })} label="Paragraph content" />;
    case "image":
      return <><MediaField value={String(data.url ?? "")} onChange={(url) => update({ url })} isDemo={isDemo} label="Image" /><div className="editor-two-col"><Field label="Caption"><input value={String(data.caption ?? "")} onChange={(e) => update({ caption: e.target.value })} /></Field><Field label="Width"><select value={String(data.width ?? "wide")} onChange={(e) => update({ width: e.target.value })}><option value="normal">Text width</option><option value="wide">Wide</option><option value="full">Full bleed</option></select></Field></div></>;
    case "gallery":
      return <GalleryEditor block={block} update={update} isDemo={isDemo} />;
    case "video":
      return <><MediaField value={String(data.url ?? "")} onChange={(url) => update({ url })} isDemo={isDemo} label="Video" accept="video/*" /><Field label="Caption"><input value={String(data.caption ?? "")} onChange={(e) => update({ caption: e.target.value })} /></Field><MediaField value={String(data.poster ?? "")} onChange={(poster) => update({ poster })} isDemo={isDemo} label="Poster image (optional)" compact /></>;
    case "quote":
      return <><Field label="Quote"><textarea value={String(data.text ?? "")} onChange={(e) => update({ text: e.target.value })} rows={3} /></Field><Field label="Attribution (optional)"><input value={String(data.author ?? "")} onChange={(e) => update({ author: e.target.value })} /></Field></>;
    case "callout":
      return <div className="editor-two-col"><Field label="Text"><textarea value={String(data.text ?? "")} onChange={(e) => update({ text: e.target.value })} rows={2} /></Field><Field label="Colour"><select value={String(data.tone ?? "lime")} onChange={(e) => update({ tone: e.target.value })}><option value="lime">Lime</option><option value="pink">Pink</option><option value="blue">Blue</option><option value="orange">Orange</option></select></Field></div>;
    case "list":
      return <><Field label="Items · one per line"><textarea value={list(data.items).join("\n")} onChange={(e) => update({ items: e.target.value.split("\n") })} rows={5} /></Field><label className="editor-check"><input type="checkbox" checked={Boolean(data.ordered)} onChange={(e) => update({ ordered: e.target.checked })} /> Numbered list</label></>;
    case "columns":
      return <div className="editor-two-col"><RichTextField value={String(data.left ?? "")} onChange={(left) => update({ left })} label="Left column" /><RichTextField value={String(data.right ?? "")} onChange={(right) => update({ right })} label="Right column" /></div>;
    case "link":
      return <div className="editor-two-col"><Field label="Button label"><input value={String(data.label ?? "")} onChange={(e) => update({ label: e.target.value })} /></Field><Field label="URL"><input value={String(data.url ?? "")} onChange={(e) => update({ url: e.target.value })} /></Field></div>;
    case "divider":
      return <p className="editor-help">A small decorative break between sections.</p>;
    default:
      return null;
  }
}

function SortableBlock({ block, update, duplicate, remove, toggleHidden, isDemo }: {
  block: ContentBlock;
  update: (data: Record<string, unknown>) => void;
  duplicate: () => void;
  remove: () => void;
  toggleHidden: () => void;
  isDemo: boolean;
}) {
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const definition = blockDefinitions.find((item) => item.type === block.type);
  const Icon = definition?.icon ?? AlignLeft;
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn("editor-block", isDragging && "is-dragging", block.hidden && "is-hidden")}>
      <div className="editor-block-header">
        <button type="button" className="drag-handle" {...attributes} {...listeners} aria-label="Drag to reorder"><GripVertical size={17} /></button>
        <span className="block-type-icon"><Icon size={16} /></span>
        <strong>{definition?.label ?? block.type}</strong>
        {block.hidden ? <span className="hidden-label">Hidden</span> : null}
        <div className="block-actions">
          <button type="button" onClick={toggleHidden} title={block.hidden ? "Show block" : "Hide block"}>{block.hidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>
          <button type="button" onClick={duplicate} title="Duplicate block"><Copy size={15} /></button>
          <button type="button" onClick={remove} title="Delete block"><Trash2 size={15} /></button>
          <button type="button" onClick={() => setOpen(!open)} aria-label={open ? "Collapse block" : "Expand block"}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
        </div>
      </div>
      {open ? <div className="editor-block-body"><BlockFields block={block} update={update} isDemo={isDemo} /></div> : null}
    </div>
  );
}

function BlockInserter({ onInsert, large = false }: { onInsert: (type: BlockType) => void; large?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("block-inserter", large && "large", open && "is-open")}>
      <button type="button" className="block-inserter-trigger" onClick={() => setOpen(!open)}><Plus size={large ? 20 : 15} />{large ? "Add your first block" : "Add block"}</button>
      {open ? (
        <div className="block-inserter-menu">
          <div><strong>Choose a block</strong><button onClick={() => setOpen(false)} aria-label="Close"><X size={15} /></button></div>
          <section>{blockDefinitions.map(({ type, label, icon: Icon }) => <button type="button" key={type} onClick={() => { onInsert(type); setOpen(false); }}><Icon size={17} /><span>{label}</span></button>)}</section>
        </div>
      ) : null}
    </div>
  );
}

export function BlockEditor({ blocks, onChange, isDemo }: { blocks: ContentBlock[]; onChange: (blocks: ContentBlock[]) => void; isDemo: boolean }) {
  const { showConfirm } = useDialog();
  const [isSorting, setIsSorting] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const update = (id: string, patch: Record<string, unknown>) => onChange(blocks.map((block) => block.id === id ? { ...block, data: { ...block.data, ...patch } } : block));
  const insert = (type: BlockType, index: number) => {
    const next = [...blocks];
    next.splice(index, 0, newBlock(type));
    onChange(next);
  };
  const duplicate = (id: string) => {
    const index = blocks.findIndex((block) => block.id === id);
    const copy = { ...blocks[index], id: cryptoId(), data: structuredClone(blocks[index].data) };
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((block) => block.id === active.id);
    const to = blocks.findIndex((block) => block.id === over.id);
    onChange(arrayMove(blocks, from, to));
  };

  return (
    <div className={cn("block-editor", isSorting && "is-sorting")} data-no-cursor>
      <div className="block-editor-intro"><div><MessageSquareQuote size={19} /><span>PROJECT STORY BUILDER</span></div><p>Drag to reorder. Add as many sections as the story needs.</p></div>
      <BlockInserter onInsert={(type) => insert(type, 0)} large={!blocks.length} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setIsSorting(true)} onDragCancel={() => setIsSorting(false)} onDragEnd={(event) => { setIsSorting(false); dragEnd(event); }}>
        <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, index) => (
            <div key={block.id}>
              <SortableBlock
                block={block}
                update={(data) => update(block.id, data)}
                duplicate={() => duplicate(block.id)}
                remove={async () => {
                  const confirmed = await showConfirm({ title: "Delete this block?", message: "This section and its content will be removed from the draft. Save the project to make the change permanent.", confirmLabel: "Delete block", danger: true });
                  if (confirmed) onChange(blocks.filter((item) => item.id !== block.id));
                }}
                toggleHidden={() => onChange(blocks.map((item) => item.id === block.id ? { ...item, hidden: !item.hidden } : item))}
                isDemo={isDemo}
              />
              <BlockInserter onInsert={(type) => insert(type, index + 1)} />
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
