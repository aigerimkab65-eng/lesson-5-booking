import { describe, expect, it } from "vitest";
import {
  applyDateChange,
  bookSlot,
  getCalendarDays,
  getDaySlots,
  getDemoBusySlots,
  getSlotStatus,
  getSlotsForDate,
  getTodayDate,
  isPastDay,
  isSlotPast,
} from "@/lib/schedule";

/** Создаёт Date, который в Asia/Almaty выглядит как указанная дата/время. */
function almatyMoment(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const utc = Date.UTC(year, month - 1, day, hour - 5, minute, 0);
  return new Date(utc);
}

describe("расписание слотов", () => {
  it("на рабочий день даёт 9 слотов с 10:00 до 18:00", () => {
    const slots = getSlotsForDate("2026-11-23"); // понедельник
    expect(slots).toHaveLength(9);
    expect(slots[0]).toBe("10:00");
    expect(slots[8]).toBe("18:00");
    expect(getDaySlots()).toEqual(slots);
  });

  it("в воскресенье слотов нет", () => {
    expect(getSlotsForDate("2026-11-22")).toEqual([]); // воскресенье
  });
});

describe("прошедшие слоты (Asia/Almaty)", () => {
  it("в 09:59 слот 10:00 ещё свободен по времени", () => {
    const now = almatyMoment(2026, 11, 24, 9, 59);
    expect(getTodayDate(now)).toBe("2026-11-24");
    expect(isSlotPast("2026-11-24", "10:00", now)).toBe(false);
    expect(getSlotStatus("2026-11-24", "10:00", { now })).not.toBe("past");
  });

  it("в 10:00 слот 10:00 уже past", () => {
    const now = almatyMoment(2026, 11, 24, 10, 0);
    expect(isSlotPast("2026-11-24", "10:00", now)).toBe(true);
    expect(getSlotStatus("2026-11-24", "10:00", { now })).toBe("past");
    expect(isSlotPast("2026-11-24", "11:00", now)).toBe(false);
  });

  it("в 18:30 слот 18:00 past, свободных на сегодня нет", () => {
    const now = almatyMoment(2026, 11, 24, 18, 30);
    expect(getSlotStatus("2026-11-24", "18:00", { now })).toBe("past");
    const free = getDaySlots().filter(
      (time) => getSlotStatus("2026-11-24", time, { now }) === "free",
    );
    expect(free).toHaveLength(0);
  });

  it("в 19:30 все слоты сегодняшнего дня past", () => {
    const now = almatyMoment(2026, 11, 24, 19, 30);
    for (const time of getDaySlots()) {
      expect(getSlotStatus("2026-11-24", time, { now })).toBe("past");
    }
  });
});

describe("календарь", () => {
  it("прошедшие дни отключены", () => {
    const now = almatyMoment(2026, 11, 24, 12, 0);
    const days = getCalendarDays(now);
    const pastDays = days.filter((day) => day.date < "2026-11-24");
    expect(pastDays.length).toBeGreaterThan(0);
    for (const day of pastDays) {
      expect(day.isPast).toBe(true);
      expect(day.disabled).toBe(true);
      expect(isPastDay(day.date, now)).toBe(true);
    }
  });

  it("покрывает текущую и следующую неделю (14 дней)", () => {
    const now = almatyMoment(2026, 11, 24, 12, 0); // вт
    const days = getCalendarDays(now);
    expect(days).toHaveLength(14);
    expect(days[0].date).toBe("2026-11-23"); // пн текущей недели
    expect(days[13].date).toBe("2026-12-06"); // вс следующей недели
    expect(days.find((day) => day.isToday)?.date).toBe("2026-11-24");
  });

  it("воскресенья отключены", () => {
    const now = almatyMoment(2026, 11, 24, 12, 0);
    const sundays = getCalendarDays(now).filter((day) => day.isSunday);
    expect(sundays.length).toBe(2);
    for (const day of sundays) {
      expect(day.disabled).toBe(true);
    }
  });
});

describe("смена даты и запись", () => {
  it("смена даты сбрасывает выбранный слот", () => {
    const result = applyDateChange("2026-11-24", "11:00", "2026-11-25");
    expect(result.date).toBe("2026-11-25");
    expect(result.time).toBeNull();
    expect(result.timeWasReset).toBe(true);
  });

  it("запись делает слот занятым", () => {
    const now = almatyMoment(2026, 11, 25, 9, 0);
    const first = bookSlot(
      [],
      {
        topicId: "site",
        topicTitle: "Сайт",
        date: "2026-11-25",
        time: "11:00",
        name: "Айгерим",
        phone: "+77007002132",
        comment: "",
      },
      now,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(getSlotStatus("2026-11-25", "11:00", { now, bookings: first.bookings })).toBe(
      "busy",
    );
  });

  it("повторная запись на тот же слот отклоняется", () => {
    const now = almatyMoment(2026, 11, 25, 9, 0);
    const payload = {
      topicId: "site",
      topicTitle: "Сайт",
      date: "2026-11-25",
      time: "12:00",
      name: "Клиент",
      phone: "+77001112233",
      comment: "",
    };
    const first = bookSlot([], payload, now);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = bookSlot(first.bookings, { ...payload, name: "Другой" }, now);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe("busy");
  });

  it("демо-занятые слоты одинаковы для одной даты", () => {
    const a = getDemoBusySlots("2026-11-26");
    const b = getDemoBusySlots("2026-11-26");
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThan(9);
  });

  it("запись на демо-занятый слот отклоняется логикой", () => {
    const now = almatyMoment(2026, 11, 26, 9, 0);
    const busy = getDemoBusySlots("2026-11-26");
    expect(busy.length).toBeGreaterThan(0);

    const result = bookSlot(
      [],
      {
        topicId: "site",
        topicTitle: "Сайт",
        date: "2026-11-26",
        time: busy[0],
        name: "Клиент",
        phone: "+77001112233",
        comment: "",
      },
      now,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("busy");
  });
});
