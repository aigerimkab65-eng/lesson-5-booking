"use client";

import { useId, useState, type FormEvent } from "react";
import {
  COMMENT_LIMIT_HINT,
  COMMENT_MAX_LENGTH,
  NAME_LIMIT_HINT,
  NAME_MAX_LENGTH,
  PHONE_TOO_LONG_HINT,
  clampComment,
  clampName,
  formatPhoneInput,
  isCommentAtLimit,
  isNameAtLimit,
  isPhoneTooLong,
  normalizePhone,
  validateName,
  validatePhone,
} from "@/lib/phone";

export interface BookingFormValues {
  name: string;
  phone: string;
  comment: string;
}

interface BookingFormProps {
  summary: {
    topicTitle: string;
    dateLabel: string;
    time: string;
  };
  onSubmit: (values: BookingFormValues) => void;
  submitError: string | null;
}

export function BookingForm({ summary, onSubmit, submitError }: BookingFormProps) {
  const formId = useId();
  const nameFieldId = `${formId}-name`;
  const phoneFieldId = `${formId}-phone`;
  const commentFieldId = `${formId}-comment`;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextNameError = validateName(name);
    const nextPhoneError = validatePhone(phone);

    setTouched({ name: true, phone: true });
    setNameError(nextNameError);
    setPhoneError(nextPhoneError);

    if (nextNameError || nextPhoneError) {
      return;
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setPhoneError("Введите полный номер в формате +7 XXX XXX-XX-XX");
      return;
    }

    setIsSubmitting(true);
    onSubmit({
      name: name.trim(),
      phone: normalized,
      comment: comment.trim(),
    });
    // Если родитель показал ошибку и остался на форме — снова разрешаем отправку.
    window.setTimeout(() => setIsSubmitting(false), 400);
  }

  return (
    <section className="fade-enter space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow)] sm:p-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
          4. Подтверждение записи
        </h2>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted">Тема:</dt>
            <dd className="font-medium text-foreground">{summary.topicTitle}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Дата:</dt>
            <dd className="font-medium text-foreground">{summary.dateLabel}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Время:</dt>
            <dd className="font-medium text-foreground">{summary.time}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <label htmlFor={nameFieldId} className="text-sm font-medium text-foreground">
            Имя
          </label>
          <input
            id={nameFieldId}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={NAME_MAX_LENGTH}
            value={name}
            onChange={(event) => {
              const next = clampName(event.target.value);
              setName(next);
              if (touched.name) {
                setNameError(validateName(next));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, name: true }));
              setNameError(validateName(name));
            }}
            className="min-h-11 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            placeholder="Как к вам обращаться"
          />
          {nameError ? (
            <p role="alert" className="text-sm text-danger">
              {nameError}
            </p>
          ) : null}
          {isNameAtLimit(name) ? (
            <p className="text-sm text-muted">{NAME_LIMIT_HINT}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={phoneFieldId} className="text-sm font-medium text-foreground">
            Телефон
          </label>
          <input
            id={phoneFieldId}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => {
              const next = formatPhoneInput(event.target.value);
              setPhone(next);
              if (touched.phone) {
                setPhoneError(validatePhone(next));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, phone: true }));
              setPhoneError(validatePhone(phone));
            }}
            className="min-h-11 w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            placeholder="+7 XXX XXX-XX-XX"
          />
          {phoneError ? (
            <p role="alert" className="text-sm text-danger">
              {phoneError}
            </p>
          ) : isPhoneTooLong(phone) ? (
            <p role="alert" className="text-sm text-danger">
              {PHONE_TOO_LONG_HINT}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={commentFieldId} className="text-sm font-medium text-foreground">
            Комментарий к консультации
          </label>
          <textarea
            id={commentFieldId}
            name="comment"
            rows={3}
            maxLength={COMMENT_MAX_LENGTH}
            value={comment}
            onChange={(event) => setComment(clampComment(event.target.value))}
            className="w-full resize-y rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            placeholder="Коротко опишите задачу (необязательно)"
          />
          {isCommentAtLimit(comment) ? (
            <p className="text-sm text-muted">{COMMENT_LIMIT_HINT}</p>
          ) : (
            <p className="text-xs text-muted">{comment.length}/{COMMENT_MAX_LENGTH}</p>
          )}
        </div>

        {submitError ? (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-contrast transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-70"
        >
          Подтвердить запись
        </button>
      </form>
    </section>
  );
}
