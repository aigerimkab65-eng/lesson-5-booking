"use client";

import { useEffect, useRef, useState } from "react";
import type { SlotView } from "@/lib/schedule";

interface SlotGridProps {
  slots: SlotView[];
  onSelect: (time: string) => void;
  timeResetHint: boolean;
}

export function SlotGrid({ slots, onSelect, timeResetHint }: SlotGridProps) {
  const [busyHint, setBusyHint] = useState<string | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current !== null) {
        window.clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  function showBusyHint(time: string) {
    if (hintTimerRef.current !== null) {
      window.clearTimeout(hintTimerRef.current);
    }
    setBusyHint(time);
    // На тач-устройствах blur срабатывает сразу — держим подсказку пару секунд.
    hintTimerRef.current = window.setTimeout(() => {
      setBusyHint((current) => (current === time ? null : current));
      hintTimerRef.current = null;
    }, 2000);
  }

  function handleSlotClick(slot: SlotView) {
    if (slot.status === "busy") {
      showBusyHint(slot.time);
      return;
    }
    if (slot.status === "past") {
      return;
    }
    setBusyHint(null);
    onSelect(slot.time);
  }

  return (
    <section className="space-y-3 fade-enter">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
          3. Выберите время
        </h2>
        <p className="mt-1 text-sm text-muted">Слоты по 60 минут, с 10:00 до 19:00</p>
      </div>

      {timeResetHint ? (
        <p
          role="status"
          className="rounded-2xl border border-accent/20 bg-accent-soft px-3 py-2 text-sm text-foreground"
        >
          Дата изменилась — пожалуйста, выберите время заново.
        </p>
      ) : null}

      <p
        role="status"
        className={`min-h-5 text-sm ${busyHint ? "text-danger" : "text-transparent"}`}
        aria-live="polite"
      >
        {busyHint ? "Время занято" : "\u00a0"}
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {slots.map((slot) => {
          const isBusy = slot.status === "busy";
          const isPast = slot.status === "past";
          const isSelected = slot.status === "selected";

          return (
            <button
              key={slot.time}
              type="button"
              disabled={isPast}
              aria-disabled={isBusy || isPast}
              aria-pressed={isSelected}
              onClick={() => handleSlotClick(slot)}
              className={`flex min-h-12 w-full items-center justify-center rounded-2xl border text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isSelected
                  ? "border-accent bg-accent text-accent-contrast"
                  : isBusy
                    ? "cursor-not-allowed border-border bg-surface-soft text-busy line-through opacity-80"
                    : isPast
                      ? "cursor-not-allowed border-transparent bg-surface-soft text-past opacity-50"
                      : "border-border bg-surface text-foreground hover:border-accent/50 hover:bg-accent-soft"
              }`}
            >
              {slot.time}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <LegendDot className="border border-border bg-surface" label="Свободно" />
        <LegendDot className="bg-accent" label="Выбрано" />
        <LegendDot className="bg-surface-soft" label="Занято" />
        <LegendDot className="bg-surface-soft opacity-50" label="Прошло" />
      </div>
    </section>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} aria-hidden />
      {label}
    </span>
  );
}
