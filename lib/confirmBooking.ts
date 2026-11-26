import { bookSlot, type BookingRecord } from "@/lib/schedule";

export type ConfirmBookingInput = {
  topicId: string;
  topicTitle: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  comment: string;
};

export type ConfirmBookingResult =
  | {
      ok: true;
      booking: BookingRecord;
      bookings: BookingRecord[];
    }
  | {
      ok: false;
      reason: "past" | "busy" | "invalid" | "save_failed";
      /** Актуальный список из storage после перечитывания */
      bookings: BookingRecord[];
      /** При отказе поля формы не очищаем */
      keepForm: true;
    };

/**
 * Подтверждение записи:
 * - использует свежий `now` (вызывающий передаёт new Date());
 * - перед записью перечитывает bookings через loadBookings;
 * - при ошибке save не считает запись успешной.
 */
export function confirmBooking(options: {
  now: Date;
  input: ConfirmBookingInput;
  loadBookings: () => BookingRecord[];
  saveBookings: (bookings: BookingRecord[]) => boolean;
}): ConfirmBookingResult {
  const latest = options.loadBookings();
  const result = bookSlot(latest, options.input, options.now);

  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      bookings: latest,
      keepForm: true,
    };
  }

  const saved = options.saveBookings(result.bookings);
  if (!saved) {
    return {
      ok: false,
      reason: "save_failed",
      bookings: latest,
      keepForm: true,
    };
  }

  return {
    ok: true,
    booking: result.booking,
    bookings: result.bookings,
  };
}

/** После отказа запись не подтверждена — форму и данные клиента сохраняем. */
export function shouldKeepFormAfterReject(
  result: ConfirmBookingResult,
): boolean {
  return !result.ok && result.keepForm === true;
}
