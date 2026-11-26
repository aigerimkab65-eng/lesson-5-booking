import { describe, expect, it } from "vitest";
import { buildBookingWhatsAppUrl } from "@/lib/whatsapp";
import { normalizePhone, isValidPhone, NAME_MAX_LENGTH, COMMENT_MAX_LENGTH } from "@/lib/phone";
import {
  SCHEDULE_CONFIG,
  applyDateChange,
  bookSlot,
  findNextDayWithFreeSlots,
  getCalendarDays,
  getDaySlots,
  getDemoBusySlots,
  getSlotStatus,
  getSlotsForDate,
  getTodayDate,
  hasFreeSlots,
  isSlotPast,
} from "@/lib/schedule";
import { TOPICS } from "@/lib/topics";
import { WHATSAPP_DISPLAY, TELEGRAM_DISPLAY } from "@/lib/constants";

function almatyMoment(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 5, minute, 0));
}

describe("доказательства по ТЗ", () => {
  it("контакты и темы совпадают с ТЗ", () => {
    expect(WHATSAPP_DISPLAY).toBe("+77007002132");
    expect(TELEGRAM_DISPLAY).toBe("@aigerim_aicreator");
    expect(TOPICS.map((t) => t.title)).toEqual([
      "Сайт (визитка, лендинг, магазин)",
      "AI-контент (фото, ролики, анимация)",
      "Дизайн (карусели, карточки)",
      "Калькулятор, каталог или онлайн-запись для бизнеса",
    ]);
    expect(TOPICS.every((t) => t.durationMinutes === 60)).toBe(true);
    expect(SCHEDULE_CONFIG.timeZone).toBe("Asia/Almaty");
    expect(NAME_MAX_LENGTH).toBe(60);
    expect(COMMENT_MAX_LENGTH).toBe(300);
  });

  it("телефон: +7 / 8 / 7 принимаются, неполный отклоняется", () => {
    expect(normalizePhone("+77007002132")).toBe("+77007002132");
    expect(normalizePhone("87007002132")).toBe("+77007002132");
    expect(normalizePhone("77007002132")).toBe("+77007002132");
    // неполный с +: меньше 11 цифр
    expect(isValidPhone("+7700700")).toBe(false);
    // неполный 8XXXXXXXXX (9 цифр вместо 11)
    expect(isValidPhone("870070021")).toBe(false);
    // обрезанный +7XXXXXXXXX (10 цифр с плюсом)
    expect(isValidPhone("+7700700213")).toBe(false);
  });

  it("WhatsApp URL строится через encodeURIComponent", () => {
    const url = buildBookingWhatsAppUrl({
      topicTitle: "Сайт (визитка, лендинг, магазин)",
      dateLabel: "среда, 25 ноября",
      time: "11:00",
      name: "Тест",
    });
    expect(url.startsWith("https://wa.me/77007002132?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Тема:"));
    expect(url).toContain(encodeURIComponent("11:00"));
  });

  it("краевые случаи now в Asia/Almaty", () => {
    const cases = [
      { h: 9, m: 59, slot: "10:00", past: false },
      { h: 10, m: 0, slot: "10:00", past: true },
      { h: 18, m: 30, slot: "18:00", past: true },
      { h: 19, m: 30, slot: "10:00", past: true },
    ] as const;

    for (const item of cases) {
      const now = almatyMoment(2026, 11, 24, item.h, item.m);
      expect(getTodayDate(now)).toBe("2026-11-24");
      expect(isSlotPast("2026-11-24", item.slot, now)).toBe(item.past);
    }

    const evening = almatyMoment(2026, 11, 24, 18, 30);
    expect(hasFreeSlots("2026-11-24", { now: evening })).toBe(false);
    const next = findNextDayWithFreeSlots("2026-11-24", {
      now: evening,
      untilDate: "2026-12-06",
    });
    expect(next).toBe("2026-11-25");
  });

  it("календарь / слоты / демо / дубликаты", () => {
    expect(getDaySlots()).toEqual([
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
    ]);
    expect(getSlotsForDate("2026-11-22")).toEqual([]);

    const now = almatyMoment(2026, 11, 24, 12, 0);
    const days = getCalendarDays(now);
    expect(days).toHaveLength(14);
    expect(days.filter((d) => d.isSunday).every((d) => d.disabled)).toBe(true);
    expect(days.filter((d) => d.isPast).every((d) => d.disabled)).toBe(true);

    const reset = applyDateChange("2026-11-24", "11:00", "2026-11-25");
    expect(reset).toEqual({ date: "2026-11-25", time: null, timeWasReset: true });

    const busyA = getDemoBusySlots("2026-11-26");
    const busyB = getDemoBusySlots("2026-11-26");
    expect(busyA).toEqual(busyB);
    expect(busyA.length).toBeGreaterThan(0);

    const bookNow = almatyMoment(2026, 11, 26, 9, 0);
    const free = getDaySlots().find(
      (t) => getSlotStatus("2026-11-26", t, { now: bookNow }) === "free",
    );
    expect(free).toBeTruthy();

    const first = bookSlot(
      [],
      {
        topicId: "site",
        topicTitle: "Сайт",
        date: "2026-11-26",
        time: free!,
        name: "A",
        phone: "+77001112233",
        comment: "",
      },
      bookNow,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(
      getSlotStatus("2026-11-26", free!, { now: bookNow, bookings: first.bookings }),
    ).toBe("busy");

    const second = bookSlot(
      first.bookings,
      {
        topicId: "site",
        topicTitle: "Сайт",
        date: "2026-11-26",
        time: free!,
        name: "B",
        phone: "+77001112234",
        comment: "",
      },
      bookNow,
    );
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe("busy");
  });
});
