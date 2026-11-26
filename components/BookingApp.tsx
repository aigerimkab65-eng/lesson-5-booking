"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { BookingForm, type BookingFormValues } from "@/components/BookingForm";
import { DatePicker } from "@/components/DatePicker";
import { EmptyDayMessage } from "@/components/EmptyDayMessage";
import { SlotGrid } from "@/components/SlotGrid";
import { SuccessScreen } from "@/components/SuccessScreen";
import { TopicPicker } from "@/components/TopicPicker";
import { loadBookings, saveBookings } from "@/lib/bookingsStorage";
import { confirmBooking } from "@/lib/confirmBooking";
import {
  BOOKINGS_STORAGE_KEY,
  BRAND_CITY,
  BRAND_NAME,
  BRAND_ROLE,
  TELEGRAM_DISPLAY,
  TELEGRAM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/constants";
import {
  addDaysToDate,
  applyDateChange,
  findNextDayWithFreeSlots,
  formatDateRu,
  getCalendarDays,
  getSlotsWithStatus,
  getTodayDate,
  hasFreeSlots,
  isSelectableSlot,
  type BookingRecord,
} from "@/lib/schedule";
import { TOPICS, getTopicById } from "@/lib/topics";

const SAVE_ERROR_MESSAGE =
  "Не удалось сохранить запись, попробуйте ещё раз или напишите в WhatsApp";
const BUSY_ERROR_MESSAGE = "Это время уже занято, выберите другое";
const PAST_ERROR_MESSAGE = "Это время уже прошло, выберите другое";

export function BookingApp() {
  const [nowTick, setNowTick] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  const [topicId, setTopicId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeResetHint, setTimeResetHint] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<BookingRecord | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    const stored = loadBookings();
    startTransition(() => {
      setBookings(stored);
      setNowTick(new Date());
    });

    const timer = window.setInterval(() => {
      setNowTick(new Date());
    }, 60_000);

    function refreshClock() {
      setNowTick(new Date());
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshClock();
        setBookings(loadBookings());
      }
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== BOOKINGS_STORAGE_KEY) {
        return;
      }
      setBookings(loadBookings());
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const today = nowTick ? getTodayDate(nowTick) : null;
  const tomorrow = today ? addDaysToDate(today, 1) : null;
  const calendarDays = useMemo(
    () => (nowTick ? getCalendarDays(nowTick) : []),
    [nowTick],
  );
  const calendarUntilDate =
    calendarDays.length > 0 ? calendarDays[calendarDays.length - 1].date : undefined;

  const selectedTopic = topicId ? getTopicById(topicId) : undefined;

  // Для сетки: выбранный слот подсвечиваем, только если он ещё свободен.
  const activeTime =
    selectedDate && selectedTime && nowTick
      ? isSelectableSlot(selectedDate, selectedTime, {
          now: nowTick,
          bookings,
        })
        ? selectedTime
        : null
      : null;

  const slots = useMemo(() => {
    if (!selectedDate || !nowTick) {
      return [];
    }
    return getSlotsWithStatus(selectedDate, {
      now: nowTick,
      bookings,
      selectedTime: activeTime,
    });
  }, [selectedDate, nowTick, bookings, activeTime]);

  const dayHasFreeSlots =
    selectedDate && nowTick
      ? hasFreeSlots(selectedDate, { now: nowTick, bookings })
      : false;

  const nextFreeDate =
    selectedDate && nowTick
      ? findNextDayWithFreeSlots(selectedDate, {
          now: nowTick,
          bookings,
          untilDate: calendarUntilDate,
        })
      : null;

  function handleSelectDate(nextDate: string) {
    const result = applyDateChange(selectedDate, selectedTime, nextDate);
    setSelectedDate(result.date);
    setSelectedTime(result.time);
    setTimeResetHint(result.timeWasReset);
    setSubmitError(null);
  }

  function handleSelectTime(time: string) {
    setSelectedTime(time);
    setTimeResetHint(false);
    setSubmitError(null);
  }

  function handleConfirm(values: BookingFormValues) {
    if (!selectedTopic || !selectedDate || !selectedTime) {
      return;
    }
    if (submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;

    // Свежее «сейчас» в момент подтверждения (Asia/Almaty внутри bookSlot).
    const now = new Date();
    setNowTick(now);

    const result = confirmBooking({
      now,
      input: {
        topicId: selectedTopic.id,
        topicTitle: selectedTopic.title,
        date: selectedDate,
        time: selectedTime,
        name: values.name,
        phone: values.phone,
        comment: values.comment,
      },
      loadBookings,
      saveBookings,
    });

    setBookings(result.bookings);

    if (!result.ok) {
      submitLockRef.current = false;
      // Не очищаем selectedTime и поля формы — клиент может выбрать другой слот.
      if (result.reason === "busy") {
        setSubmitError(BUSY_ERROR_MESSAGE);
      } else if (result.reason === "past") {
        setSubmitError(PAST_ERROR_MESSAGE);
      } else if (result.reason === "save_failed") {
        setSubmitError(SAVE_ERROR_MESSAGE);
      } else {
        setSubmitError("Не удалось записаться. Проверьте дату и время.");
      }
      return;
    }

    setSuccessBooking(result.booking);
    setSubmitError(null);
  }

  function handleBookAgain() {
    submitLockRef.current = false;
    setSuccessBooking(null);
    setTopicId(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setTimeResetHint(false);
    setSubmitError(null);
  }

  if (successBooking) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Header />
        <div className="mt-8">
          <SuccessScreen booking={successBooking} onBookAgain={handleBookAgain} />
        </div>
      </main>
    );
  }

  if (!nowTick || !today || !tomorrow) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Header />
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-surface-soft" />
      </main>
    );
  }

  // Форму держим по selectedTime (не только activeTime), чтобы при отказе
  // имя/телефон/комментарий не пропали. Без key — смена слота не сбрасывает поля.
  const showForm = Boolean(topicId && selectedDate && selectedTime && selectedTopic);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Header />

      <div className="mt-8 space-y-8">
        <TopicPicker
          topics={TOPICS}
          selectedId={topicId}
          onSelect={(id) => {
            setTopicId(id);
            setSubmitError(null);
          }}
        />

        {topicId ? (
          <DatePicker
            today={today}
            tomorrow={tomorrow}
            selectedDate={selectedDate}
            calendarDays={calendarDays}
            onSelect={handleSelectDate}
          />
        ) : null}

        {topicId && selectedDate ? (
          dayHasFreeSlots ? (
            <SlotGrid
              slots={slots}
              onSelect={handleSelectTime}
              timeResetHint={timeResetHint}
            />
          ) : (
            <EmptyDayMessage
              nextFreeDate={nextFreeDate}
              nextFreeLabel={nextFreeDate ? formatDateRu(nextFreeDate) : null}
              onJump={handleSelectDate}
            />
          )
        ) : null}

        {showForm && selectedTopic && selectedDate && selectedTime ? (
          <BookingForm
            summary={{
              topicTitle: selectedTopic.title,
              dateLabel: formatDateRu(selectedDate),
              time: selectedTime,
            }}
            onSubmit={handleConfirm}
            submitError={submitError}
          />
        ) : null}
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="card-enter">
      <p className="text-sm font-medium text-accent">AIBooking</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {BRAND_NAME}
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        {BRAND_ROLE} в {BRAND_CITY}. Выберите тему, дату и свободное время — я
        подтвержу запись.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-accent transition hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp {WHATSAPP_DISPLAY}
        </a>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-accent transition hover:opacity-90"
        >
          <Send className="h-4 w-4" aria-hidden />
          Telegram {TELEGRAM_DISPLAY}
        </a>
      </div>
    </header>
  );
}
