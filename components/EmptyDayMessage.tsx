"use client";

interface EmptyDayMessageProps {
  nextFreeDate: string | null;
  nextFreeLabel: string | null;
  onJump: (date: string) => void;
}

export function EmptyDayMessage({
  nextFreeDate,
  nextFreeLabel,
  onJump,
}: EmptyDayMessageProps) {
  return (
    <div className="fade-enter rounded-2xl border border-border bg-surface px-4 py-5 text-center">
      <p className="text-sm text-foreground">
        На этот день свободного времени уже нет. Можно выбрать другой день.
      </p>
      {nextFreeDate && nextFreeLabel ? (
        <button
          type="button"
          onClick={() => onJump(nextFreeDate)}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-contrast transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Перейти на {nextFreeLabel}
        </button>
      ) : null}
    </div>
  );
}
