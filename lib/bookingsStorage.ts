import { BOOKINGS_STORAGE_KEY } from "@/lib/constants";
import type { BookingRecord } from "@/lib/schedule";

export function loadBookings(): BookingRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isBookingRecord);
  } catch {
    return [];
  }
}

/** true — сохранено; false — ошибка или storage недоступен. */
export function saveBookings(bookings: BookingRecord[]): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch {
    return false;
  }
}

function isBookingRecord(value: unknown): value is BookingRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.topicId === "string" &&
    typeof record.topicTitle === "string" &&
    typeof record.date === "string" &&
    typeof record.time === "string" &&
    typeof record.name === "string" &&
    typeof record.phone === "string" &&
    typeof record.comment === "string" &&
    typeof record.createdAt === "string"
  );
}
