"use client";

import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useId, useRef, useState } from "react";

export function DatePicker({ value, minDate, maxDate, onChange }: { value: string; minDate: string; maxDate: string; onChange: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"up" | "down">("down");
  const [month, setMonth] = useState(() => DateTime.fromISO(value).startOf("month"));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  const selected = DateTime.fromISO(value);
  const today = DateTime.now().setZone("Asia/Calcutta");
  const firstDay = month.startOf("month");
  const days = Array.from({ length: 42 }, (_, index) => firstDay.minus({ days: firstDay.weekday - 1 }).plus({ days: index }));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setMonth(selected.startOf("month"));
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (bounds) setPlacement(window.innerHeight - bounds.bottom < 400 && bounds.top > 390 ? "up" : "down");
    }
    setOpen(!open);
  };
  const minMonth = DateTime.fromISO(minDate).startOf("month");
  const maxMonth = DateTime.fromISO(maxDate).startOf("month");

  return (
    <div className="booking-date-picker" ref={rootRef}>
      <button ref={triggerRef} type="button" className="booking-date-trigger" onClick={toggle} aria-expanded={open} aria-controls={popoverId} aria-haspopup="dialog">
        <CalendarDays size={17} /><span>{selected.toFormat("ccc, d LLL yyyy")}</span><ChevronDown size={15} className={open ? "is-open" : ""} />
      </button>
      {open ? (
        <div className={`booking-calendar ${placement === "up" ? "is-up" : ""}`} id={popoverId} role="dialog" aria-label="Choose a weekday for your Google Meet">
          <div className="booking-calendar-heading">
            <button type="button" onClick={() => setMonth(month.minus({ months: 1 }))} disabled={month <= minMonth} aria-label="Previous month"><ChevronLeft size={16} /></button>
            <strong>{month.toFormat("LLLL yyyy")}</strong>
            <button type="button" onClick={() => setMonth(month.plus({ months: 1 }))} disabled={month >= maxMonth} aria-label="Next month"><ChevronRight size={16} /></button>
          </div>
          <div className="booking-calendar-weekdays" aria-hidden="true">{["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="booking-calendar-grid">
            {days.map((day) => {
              const iso = day.toISODate()!;
              const outside = !day.hasSame(month, "month");
              const disabled = outside || day.weekday > 5 || iso < minDate || iso > maxDate;
              const isSelected = day.hasSame(selected, "day");
              return <button type="button" key={iso} className={`${isSelected ? "is-selected" : ""} ${day.hasSame(today, "day") ? "is-today" : ""}`} disabled={disabled} onClick={() => { onChange(iso); setOpen(false); }} aria-label={`${day.toFormat("cccc, d LLLL yyyy")}${day.weekday > 5 ? ", weekend unavailable" : ""}`} aria-pressed={isSelected}><span>{day.day}</span>{isSelected ? <Check size={11} /> : null}</button>;
            })}
          </div>
          <div className="booking-calendar-note"><span /><p>Weekdays only · times follow Rashi’s IST calendar</p></div>
        </div>
      ) : null}
    </div>
  );
}
