import { WHATSAPP_URL } from "@/lib/constants";

export interface BookingMessagePayload {
  topicTitle: string;
  dateLabel: string;
  time: string;
  name: string;
}

export function buildBookingMessage(payload: BookingMessagePayload): string {
  return [
    "Здравствуйте! Подтверждаю запись на консультацию.",
    `Тема: ${payload.topicTitle}`,
    `Дата: ${payload.dateLabel}`,
    `Время: ${payload.time}`,
    `Имя: ${payload.name}`,
  ].join("\n");
}

export function buildBookingWhatsAppUrl(payload: BookingMessagePayload): string {
  const text = encodeURIComponent(buildBookingMessage(payload));
  return `${WHATSAPP_URL}?text=${text}`;
}

export function openWhatsAppUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
