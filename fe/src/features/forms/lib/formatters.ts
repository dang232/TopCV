import { FieldType, type FormField } from '@topcv/shared';

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function truncateId(value: string, keep = 8): string {
  if (value.length <= keep * 2 + 1) return value;
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

export function normalizeAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function todayIsoDate(): string {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

export function fieldPlaceholder(field: FormField): string {
  const label = field.label?.trim();
  const labelHint = label ? ` (${label})` : '';

  switch (field.type) {
    case FieldType.Number:
      return `Enter a number${labelHint}`;
    case FieldType.Date:
      return 'YYYY-MM-DD';
    case FieldType.Color:
      return 'Pick a color';
    case FieldType.Select:
      return 'Select…';
    case FieldType.Text:
    default:
      return label ? `Enter ${label}` : 'Enter your answer';
  }
}
