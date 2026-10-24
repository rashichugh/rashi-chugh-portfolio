import { DateTime, Interval } from "luxon";

export type BusyInterval = { start: string; end: string };
export type BookingSlot = { start: string; end: string; label: string; timeLabel: string };

export function bookingSettings() {
  const duration = Math.min(120, Math.max(15, Number(process.env.BOOKING_DURATION_MINUTES) || 30));
  return {
    hostZone: process.env.BOOKING_TIME_ZONE || "Asia/Calcutta",
    duration,
    startHour: Math.min(22, Math.max(0, Number(process.env.BOOKING_START_HOUR) || 10)),
    endHour: Math.min(23, Math.max(1, Number(process.env.BOOKING_END_HOUR) || 18)),
    maxDays: Math.min(180, Math.max(7, Number(process.env.BOOKING_MAX_DAYS) || 60)),
    minNoticeHours: Math.min(72, Math.max(0, Number(process.env.BOOKING_MIN_NOTICE_HOURS) || 2)),
  };
}

export function generateBookingSlots(date: string, visitorZone: string, busy: BusyInterval[] = []): BookingSlot[] {
  const settings = bookingSettings();
  const hostDate = DateTime.fromISO(date, { zone: settings.hostZone });
  const zone = DateTime.now().setZone(visitorZone).isValid ? visitorZone : "Asia/Calcutta";
  if (!hostDate.isValid || hostDate.toISODate() !== date || hostDate.weekday > 5 || settings.endHour <= settings.startHour) return [];
  const earliest = DateTime.now().setZone(settings.hostZone).plus({ hours: settings.minNoticeHours });
  const latest = DateTime.now().setZone(settings.hostZone).plus({ days: settings.maxDays });
  const busyIntervals = busy.map((item) => Interval.fromDateTimes(DateTime.fromISO(item.start), DateTime.fromISO(item.end))).filter((item) => item.isValid);
  const slots: BookingSlot[] = [];

  const dayEnd = hostDate.set({ hour: settings.endHour, minute: 0, second: 0, millisecond: 0 });
  for (let start = hostDate.set({ hour: settings.startHour, minute: 0, second: 0, millisecond: 0 }); start < dayEnd; start = start.plus({ minutes: settings.duration })) {
    const end = start.plus({ minutes: settings.duration });
    if (end > dayEnd || start < earliest || start > latest) continue;
    const interval = Interval.fromDateTimes(start, end);
    if (busyIntervals.some((item) => item.overlaps(interval))) continue;
    const local = start.setZone(zone);
    slots.push({
      start: start.toUTC().toISO()!,
      end: end.toUTC().toISO()!,
      label: local.toFormat("ccc, d LLL · h:mm a"),
      timeLabel: local.toFormat("h:mm a"),
    });
  }
  return slots;
}

export function slotIsStillAvailable(startISO: string, endISO: string, busy: BusyInterval[]) {
  const start = DateTime.fromISO(startISO, { zone: "utc" });
  const end = DateTime.fromISO(endISO, { zone: "utc" });
  if (!start.isValid || !end.isValid || end <= start) return false;
  const settings = bookingSettings();
  const hostDate = start.setZone(settings.hostZone).toISODate();
  if (!hostDate) return false;
  return generateBookingSlots(hostDate, "utc", busy).some((slot) => slot.start === start.toUTC().toISO() && slot.end === end.toUTC().toISO());
}
