import { describe, expect, it } from "vitest";
import {
  confirmBooking,
  shouldKeepFormAfterReject,
  type ConfirmBookingInput,
} from "@/lib/confirmBooking";
import { saveBookings } from "@/lib/bookingsStorage";
import type { BookingRecord } from "@/lib/schedule";

function almatyMoment(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 5, minute, 0));
}

function baseInput(overrides: Partial<ConfirmBookingInput> = {}): ConfirmBookingInput {
  return {
    topicId: "site",
    topicTitle: "Сайт",
    date: "2026-11-25",
    time: "11:00",
    name: "Айгерим",
    phone: "+77007002132",
    comment: "Нужен лендинг",
    ...overrides,
  };
}

function makeBooking(overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: "demo",
    topicId: "site",
    topicTitle: "Сайт",
    date: "2026-11-25",
    time: "11:00",
    name: "Уже записан",
    phone: "+77001112233",
    comment: "",
    createdAt: "2026-11-24T00:00:00.000Z",
    ...overrides,
  };
}

describe("надёжность подтверждения записи", () => {
  it("использует свежий now: слот в прошлом отклоняется", () => {
    // «Свежие» часы — 11:00, слот 11:00 уже past.
    const freshNow = almatyMoment(2026, 11, 25, 11, 0);
    const result = confirmBooking({
      now: freshNow,
      input: baseInput({ time: "11:00" }),
      loadBookings: () => [],
      saveBookings: () => true,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("past");
    expect(shouldKeepFormAfterReject(result)).toBe(true);
  });

  it("использует свежий now: тот же слот раньше ещё можно забронировать", () => {
    const freshNow = almatyMoment(2026, 11, 25, 9, 0);
    const result = confirmBooking({
      now: freshNow,
      input: baseInput({ time: "11:00" }),
      loadBookings: () => [],
      saveBookings: () => true,
    });

    expect(result.ok).toBe(true);
  });

  it("перед записью перечитывает storage и ловит чужую бронь", () => {
    // В памяти «пусто», но loadBookings уже видит запись другой вкладки.
    const fromOtherTab = [makeBooking()];
    const result = confirmBooking({
      now: almatyMoment(2026, 11, 25, 9, 0),
      input: baseInput({ name: "Новый клиент" }),
      loadBookings: () => fromOtherTab,
      saveBookings: () => true,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("busy");
    expect(result.bookings).toEqual(fromOtherTab);
    expect(shouldKeepFormAfterReject(result)).toBe(true);
  });

  it("если save не удался — запись не подтверждена", () => {
    const result = confirmBooking({
      now: almatyMoment(2026, 11, 25, 9, 0),
      input: baseInput(),
      loadBookings: () => [],
      saveBookings: () => false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("save_failed");
    expect(result.bookings).toEqual([]);
    expect(shouldKeepFormAfterReject(result)).toBe(true);
  });

  it("при отказе keepForm=true — данные формы сохраняем", () => {
    const formData = {
      name: "Клиент Тест",
      phone: "+77001234567",
      comment: "Оставить эти поля",
    };

    const busyResult = confirmBooking({
      now: almatyMoment(2026, 11, 25, 9, 0),
      input: baseInput(formData),
      loadBookings: () => [makeBooking()],
      saveBookings: () => true,
    });

    expect(busyResult.ok).toBe(false);
    expect(shouldKeepFormAfterReject(busyResult)).toBe(true);
    // Логика не мутирует и не обнуляет поля ввода — они остаются у вызывающего.
    expect(formData.name).toBe("Клиент Тест");
    expect(formData.phone).toBe("+77001234567");
    expect(formData.comment).toBe("Оставить эти поля");
  });

  it("saveBookings возвращает false при ошибке storage", () => {
    const originalWindow = globalThis.window;
    const store: Record<string, string> = {};

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => store[key] ?? null,
          setItem: () => {
            throw new Error("quota");
          },
          removeItem: (key: string) => {
            delete store[key];
          },
        },
      },
    });

    try {
      expect(saveBookings([makeBooking()])).toBe(false);
    } finally {
      if (originalWindow === undefined) {
        Reflect.deleteProperty(globalThis, "window");
      } else {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: originalWindow,
        });
      }
    }
  });

  it("saveBookings возвращает true при успехе", () => {
    const originalWindow = globalThis.window;
    const store: Record<string, string> = {};

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => store[key] ?? null,
          setItem: (key: string, value: string) => {
            store[key] = value;
          },
          removeItem: (key: string) => {
            delete store[key];
          },
        },
      },
    });

    try {
      expect(saveBookings([makeBooking()])).toBe(true);
      expect(store["aibooking-bookings-v1"]).toContain("Уже записан");
    } finally {
      if (originalWindow === undefined) {
        Reflect.deleteProperty(globalThis, "window");
      } else {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: originalWindow,
        });
      }
    }
  });
});
