"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";
import type { BookingRecord } from "@/lib/schedule";
import { formatDateRu } from "@/lib/schedule";
import { buildBookingWhatsAppUrl, openWhatsAppUrl } from "@/lib/whatsapp";

interface SuccessScreenProps {
  booking: BookingRecord;
  onBookAgain: () => void;
}

export function SuccessScreen({ booking, onBookAgain }: SuccessScreenProps) {
  const dateLabel = formatDateRu(booking.date);

  function handleWhatsApp() {
    const url = buildBookingWhatsAppUrl({
      topicTitle: booking.topicTitle,
      dateLabel,
      time: booking.time,
      name: booking.name,
    });
    openWhatsAppUrl(url);
  }

  return (
    <section className="card-enter mx-auto max-w-lg rounded-2xl border border-accent/25 bg-surface p-5 text-center shadow-[var(--shadow)] sm:p-7">
      <CheckCircle2 className="mx-auto h-12 w-12 text-accent" aria-hidden />
      <h2 className="mt-3 font-display text-xl font-semibold text-foreground sm:text-2xl">
        Вы записаны!
      </h2>
      <p className="mt-2 text-sm text-muted">
        Сохранила вашу запись. Можно отправить подтверждение в WhatsApp.
      </p>

      <dl className="mt-5 space-y-2 rounded-2xl bg-surface-soft px-4 py-4 text-left text-sm">
        <div className="flex gap-2">
          <dt className="text-muted">Тема:</dt>
          <dd className="font-medium text-foreground">{booking.topicTitle}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Дата:</dt>
          <dd className="font-medium text-foreground">{dateLabel}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Время:</dt>
          <dd className="font-medium text-foreground">{booking.time}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Имя:</dt>
          <dd className="font-medium text-foreground">{booking.name}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={handleWhatsApp}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-contrast transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Отправить подтверждение в WhatsApp
      </button>

      <button
        type="button"
        onClick={onBookAgain}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Записаться ещё раз
      </button>
    </section>
  );
}
