"use client";

import type { CalendarDay } from "@/lib/schedule";

interface DatePickerProps {
  today: string;
  tomorrow: string;
  selectedDate: string | null;
  calendarDays: CalendarDay[];
  onSelect: (date: string) => void;
}

export function DatePicker({
  today,
  tomorrow,
  selectedDate,
  calendarDays,
  onSelect,
}: DatePickerProps) {
  const todayDisabled = calendarDays.find((day) => day.date === today)?.disabled ?? true;
  const tomorrowDisabled =
    calendarDays.find((day) => day.date === tomorrow)?.disabled ?? true;

  return (
    <section className="space-y-3 fade-enter">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
          2. Выберите дату
        </h2>
        <p className="mt-1 text-sm text-muted">
          Работаю с понедельника по субботу. Воскресенье — выходной.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <QuickDateButton
          label="Сегодня"
          active={selectedDate === today}
          disabled={todayDisabled}
          onClick={() => onSelect(today)}
        />
        <QuickDateButton
          label="Завтра"
          active={selectedDate === tomorrow}
          disabled={tomorrowDisabled}
          onClick={() => onSelect(tomorrow)}
        />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Эта и следующая неделя
        </p>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.slice(0, 7).map((day) => (
            <span
              key={`label-${day.date}`}
              className="text-center text-[11px] font-medium uppercase text-muted"
            >
              {day.label}
            </span>
          ))}
          {calendarDays.map((day) => {
            const active = selectedDate === day.date;
            return (
              <button
                key={day.date}
                type="button"
                disabled={day.disabled}
                aria-label={day.date}
                aria-pressed={active}
                onClick={() => onSelect(day.date)}
                className={`flex min-h-11 flex-col items-center justify-center rounded-2xl text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  day.disabled
                    ? "cursor-not-allowed bg-surface-soft text-past opacity-55"
                    : active
                      ? "bg-accent font-semibold text-accent-contrast"
                      : day.isToday
                        ? "border border-accent bg-accent-soft font-semibold text-accent"
                        : "bg-surface-soft text-foreground hover:bg-accent-soft"
                }`}
              >
                <span>{day.dayNumber}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function QuickDateButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        disabled
          ? "cursor-not-allowed bg-surface-soft text-past opacity-60"
          : active
            ? "bg-accent text-accent-contrast"
            : "border border-border bg-surface text-foreground hover:border-accent/40"
      }`}
    >
      {label}
    </button>
  );
}
