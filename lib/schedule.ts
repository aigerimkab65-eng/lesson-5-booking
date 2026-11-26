/**
 * Чистая логика расписания AIBooking.
 * Без UI и без localStorage — удобно тестировать.
 */

export const SCHEDULE_CONFIG = {
  timeZone: "Asia/Almaty",
  /** JS weekday: 0 = воскресенье, 1 = понедельник ... 6 = суббота */
  workWeekdays: [1, 2, 3, 4, 5, 6] as const,
  startHour: 10,
  endHour: 19,
  slotMinutes: 60,
} as const;

export type SlotStatus = "free" | "busy" | "past" | "selected";

export interface BookingRecord {
  id: string;
  topicId: string;
  topicTitle: string;
  date: string; // YYYY-MM-DD в Asia/Almaty
  time: string; // HH:MM
  name: string;
  phone: string;
  comment: string;
  createdAt: string;
}

export interface CalendarDay {
  date: string;
  weekday: number;
  label: string;
  dayNumber: number;
  isToday: boolean;
  isSunday: boolean;
  isPast: boolean;
  disabled: boolean;
}

export interface SlotView {
  time: string;
  status: SlotStatus;
}

export interface AlmatyNow {
  date: string;
  hour: number;
  minute: number;
  weekday: number;
}

const WEEKDAY_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Части «сейчас» всегда в Asia/Almaty, даже если браузер в другом поясе. */
export function getAlmatyNow(now: Date = new Date()): AlmatyNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHEDULE_CONFIG.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  // На части движков полночь может прийти как 24:00 — нормализуем в 0:00.
  let hour = Number(map.hour);
  if (hour === 24) {
    hour = 0;
  }

  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hour,
    minute: Number(map.minute),
    weekday: weekdayMap[map.weekday] ?? 0,
  };
}

export function getTodayDate(now: Date = new Date()): string {
  return getAlmatyNow(now).date;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const date = new Date(utc);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function getWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isSunday(dateStr: string): boolean {
  return getWeekday(dateStr) === 0;
}

export function isWorkingDay(dateStr: string): boolean {
  const weekday = getWeekday(dateStr);
  return (SCHEDULE_CONFIG.workWeekdays as readonly number[]).includes(weekday);
}

export function isPastDay(dateStr: string, now: Date = new Date()): boolean {
  return dateStr < getTodayDate(now);
}

export function compareDateTime(
  dateStr: string,
  time: string,
  now: Date = new Date(),
): number {
  const almaty = getAlmatyNow(now);
  const [hour, minute] = time.split(":").map(Number);
  const left = dateStr.replaceAll("-", "") + pad2(hour) + pad2(minute);
  const right =
    almaty.date.replaceAll("-", "") + pad2(almaty.hour) + pad2(almaty.minute);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** Слот уже начался или в прошлом → past. */
export function isSlotPast(
  dateStr: string,
  time: string,
  now: Date = new Date(),
): boolean {
  return compareDateTime(dateStr, time, now) <= 0;
}

/** 9 слотов: 10:00 … 18:00 */
export function getDaySlots(): string[] {
  const slots: string[] = [];
  const { startHour, endHour, slotMinutes } = SCHEDULE_CONFIG;
  const totalMinutes = (endHour - startHour) * 60;

  for (let offset = 0; offset + slotMinutes <= totalMinutes; offset += slotMinutes) {
    const hour = startHour + Math.floor(offset / 60);
    const minute = offset % 60;
    slots.push(`${pad2(hour)}:${pad2(minute)}`);
  }

  return slots;
}

export function getSlotsForDate(dateStr: string): string[] {
  if (!isWorkingDay(dateStr)) {
    return [];
  }
  return getDaySlots();
}

/** Детерминированный «хэш» даты — одинаковый результат при каждом запуске. */
export function hashDate(dateStr: string): number {
  let hash = 2166136261;
  for (let i = 0; i < dateStr.length; i += 1) {
    hash ^= dateStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Фиксированный набор занятых слотов для демо.
 * На рабочий день всегда есть и занятые, и свободные.
 */
export function getDemoBusySlots(dateStr: string): string[] {
  const slots = getSlotsForDate(dateStr);
  if (slots.length === 0) {
    return [];
  }

  const hash = hashDate(dateStr);
  const busyCount = 2 + (hash % 2); // 2 или 3
  const busy = new Set<string>();

  for (let i = 0; i < busyCount; i += 1) {
    const index = (hash + i * 3) % slots.length;
    busy.add(slots[index]);
  }

  // Гарантируем хотя бы один свободный слот
  if (busy.size >= slots.length) {
    busy.delete(slots[0]);
  }

  return slots.filter((slot) => busy.has(slot));
}

export function makeSlotKey(date: string, time: string): string {
  return `${date}|${time}`;
}

export function getBookedSlotKeys(bookings: BookingRecord[]): Set<string> {
  return new Set(bookings.map((booking) => makeSlotKey(booking.date, booking.time)));
}

export function isSlotBusy(
  dateStr: string,
  time: string,
  bookings: BookingRecord[] = [],
): boolean {
  if (getDemoBusySlots(dateStr).includes(time)) {
    return true;
  }
  return getBookedSlotKeys(bookings).has(makeSlotKey(dateStr, time));
}

export function getSlotStatus(
  dateStr: string,
  time: string,
  options: {
    now?: Date;
    bookings?: BookingRecord[];
    selectedTime?: string | null;
  } = {},
): SlotStatus {
  const { now = new Date(), bookings = [], selectedTime = null } = options;

  if (isSlotPast(dateStr, time, now)) {
    return "past";
  }
  if (isSlotBusy(dateStr, time, bookings)) {
    return "busy";
  }
  if (selectedTime === time) {
    return "selected";
  }
  return "free";
}

export function getSlotsWithStatus(
  dateStr: string,
  options: {
    now?: Date;
    bookings?: BookingRecord[];
    selectedTime?: string | null;
  } = {},
): SlotView[] {
  return getSlotsForDate(dateStr).map((time) => ({
    time,
    status: getSlotStatus(dateStr, time, options),
  }));
}

export function hasFreeSlots(
  dateStr: string,
  options: { now?: Date; bookings?: BookingRecord[] } = {},
): boolean {
  return getSlotsWithStatus(dateStr, options).some((slot) => slot.status === "free");
}

/** Понедельник недели, в которой лежит dateStr (неделя пн–вс). */
export function getWeekStart(dateStr: string): string {
  const weekday = getWeekday(dateStr);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToDate(dateStr, mondayOffset);
}

/**
 * Мини-календарь: текущая неделя + следующая (14 дней, пн–вс).
 */
export function getCalendarDays(now: Date = new Date()): CalendarDay[] {
  const today = getTodayDate(now);
  const weekStart = getWeekStart(today);
  const days: CalendarDay[] = [];

  for (let i = 0; i < 14; i += 1) {
    const date = addDaysToDate(weekStart, i);
    const weekday = getWeekday(date);
    const sunday = weekday === 0;
    const past = isPastDay(date, now);
    const disabled = past || sunday || !isWorkingDay(date);

    days.push({
      date,
      weekday,
      label: WEEKDAY_SHORT[weekday],
      dayNumber: Number(date.slice(8, 10)),
      isToday: date === today,
      isSunday: sunday,
      isPast: past,
      disabled,
    });
  }

  return days;
}

export function findNextDayWithFreeSlots(
  fromDate: string,
  options: {
    now?: Date;
    bookings?: BookingRecord[];
    maxLookahead?: number;
    /** Не искать даты позже этой (например, край мини-календаря). */
    untilDate?: string;
  } = {},
): string | null {
  const {
    now = new Date(),
    bookings = [],
    maxLookahead = 21,
    untilDate,
  } = options;

  for (let i = 1; i <= maxLookahead; i += 1) {
    const candidate = addDaysToDate(fromDate, i);
    if (untilDate && candidate > untilDate) {
      break;
    }
    if (!isWorkingDay(candidate)) {
      continue;
    }
    if (hasFreeSlots(candidate, { now, bookings })) {
      return candidate;
    }
  }

  return null;
}

/** Можно ли оставить выбранный слот (ещё free/selected). */
export function isSelectableSlot(
  dateStr: string,
  time: string,
  options: { now?: Date; bookings?: BookingRecord[] } = {},
): boolean {
  const status = getSlotStatus(dateStr, time, options);
  return status === "free" || status === "selected";
}

/**
 * Смена даты сбрасывает выбранный слот.
 * Возвращает флаг, что нужно показать подсказку.
 */
export function applyDateChange(
  previousDate: string | null,
  previousTime: string | null,
  nextDate: string,
): { date: string; time: string | null; timeWasReset: boolean } {
  if (previousDate === nextDate) {
    return { date: nextDate, time: previousTime, timeWasReset: false };
  }

  return {
    date: nextDate,
    time: null,
    timeWasReset: previousTime !== null,
  };
}

export type BookSlotResult =
  | { ok: true; booking: BookingRecord; bookings: BookingRecord[] }
  | { ok: false; reason: "past" | "busy" | "invalid" };

export function createBookingId(date: string, time: string, name: string): string {
  return `${date}-${time}-${name.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

/**
 * Запись на слот. Дубликаты отклоняются логикой, не только UI.
 */
export function bookSlot(
  bookings: BookingRecord[],
  input: {
    topicId: string;
    topicTitle: string;
    date: string;
    time: string;
    name: string;
    phone: string;
    comment: string;
  },
  now: Date = new Date(),
): BookSlotResult {
  if (!input.date || !input.time || !isWorkingDay(input.date)) {
    return { ok: false, reason: "invalid" };
  }

  if (!getDaySlots().includes(input.time)) {
    return { ok: false, reason: "invalid" };
  }

  if (isSlotPast(input.date, input.time, now)) {
    return { ok: false, reason: "past" };
  }

  if (isSlotBusy(input.date, input.time, bookings)) {
    return { ok: false, reason: "busy" };
  }

  const booking: BookingRecord = {
    id: createBookingId(input.date, input.time, input.name),
    topicId: input.topicId,
    topicTitle: input.topicTitle,
    date: input.date,
    time: input.time,
    name: input.name.trim(),
    phone: input.phone,
    comment: input.comment.trim(),
    createdAt: now.toISOString(),
  };

  return {
    ok: true,
    booking,
    bookings: [...bookings, booking],
  };
}

export function formatDateRu(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(date);
}
