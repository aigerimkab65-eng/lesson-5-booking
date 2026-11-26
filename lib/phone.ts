export const NAME_MAX_LENGTH = 60;
export const COMMENT_MAX_LENGTH = 300;

export const PHONE_TOO_LONG_HINT = "Номер слишком длинный, проверьте цифры";
export const NAME_LIMIT_HINT = "Достигнут лимит — максимум 60 символов";
export const COMMENT_LIMIT_HINT = "Достигнут лимит — максимум 300 символов";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Приводит телефон к виду +7XXXXXXXXXX.
 * Принимает +7..., 8..., 7..., с пробелами, скобками и дефисами.
 */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  let digits = digitsOnly(trimmed);

  if (digits.length > 11) {
    return null;
  }

  if (trimmed.includes("+")) {
    if (digits.length === 11 && digits.startsWith("8")) {
      digits = `7${digits.slice(1)}`;
    }
    if (digits.length === 11 && digits.startsWith("7")) {
      return `+${digits}`;
    }
    return null;
  }

  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.length === 10) {
    digits = `7${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+${digits}`;
  }

  return null;
}

export function isPhoneTooLong(value: string): boolean {
  return digitsOnly(value).length > 11;
}

export function isValidPhone(value: string): boolean {
  if (isPhoneTooLong(value)) {
    return false;
  }
  const normalized = normalizePhone(value);
  return normalized !== null && /^\+7\d{10}$/.test(normalized);
}

function formatUpToElevenDigits(digits: string, hasPlus: boolean): string {
  let working = digits;

  if (!working) {
    return "";
  }

  if (working.length === 11 && working.startsWith("8")) {
    working = `7${working.slice(1)}`;
  }

  let national: string;
  if (working.length === 11 && working.startsWith("7")) {
    national = working.slice(1);
  } else if (!hasPlus && working.length === 10) {
    national = working;
  } else if (working.startsWith("7") || working.startsWith("8")) {
    national = working.slice(1, 11);
  } else {
    national = working.slice(0, 10);
  }

  let result = "+7";

  if (national.length > 0) {
    result += ` ${national.slice(0, 3)}`;
  }
  if (national.length > 3) {
    result += ` ${national.slice(3, 6)}`;
  }
  if (national.length > 6) {
    result += `-${national.slice(6, 8)}`;
  }
  if (national.length > 8) {
    result += `-${national.slice(8, 10)}`;
  }

  return result;
}

export function formatPhoneInput(value: string): string {
  const hasPlus = value.includes("+");
  const allDigits = digitsOnly(value);

  if (!allDigits) {
    return "";
  }

  if (allDigits.length > 11) {
    const head = formatUpToElevenDigits(allDigits.slice(0, 11), hasPlus);
    const overflow = allDigits.slice(11);
    return `${head}${overflow}`;
  }

  return formatUpToElevenDigits(allDigits, hasPlus);
}

export function clampName(name: string): string {
  return name.slice(0, NAME_MAX_LENGTH);
}

export function clampComment(comment: string): string {
  return comment.slice(0, COMMENT_MAX_LENGTH);
}

export function isNameAtLimit(name: string): boolean {
  return name.length >= NAME_MAX_LENGTH;
}

export function isCommentAtLimit(comment: string): boolean {
  return comment.length >= COMMENT_MAX_LENGTH;
}

export function validateName(name: string): string | null {
  if (name.trim().length < 2) {
    return "Введите имя — минимум 2 символа";
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (isPhoneTooLong(phone)) {
    return PHONE_TOO_LONG_HINT;
  }
  if (!isValidPhone(phone)) {
    return "Введите полный номер в формате +7 XXX XXX-XX-XX";
  }
  return null;
}
