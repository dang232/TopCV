import { z } from 'zod';
import { FieldType, submissionAnswerKey, type FormAnswerValue, type FormField } from '@topcv/shared/forms';

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a #RRGGBB hex value');

function isPastDate(value: string): boolean {
  const inputDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(inputDate.getTime())) {
    return true;
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  return inputDate < todayUtc;
}

function answerSchemaForField(field: FormField): z.ZodType<FormAnswerValue | undefined> {
  let schema: z.ZodType<FormAnswerValue>;

  switch (field.type) {
    case FieldType.Text:
      schema = z.string().max(200);
      break;
    case FieldType.Number:
      // Zod v4 numbers are finite by default (NaN/±Infinity are rejected).
      schema = z.number().min(0).max(100);
      break;
    case FieldType.Date:
      schema = z.string().refine((value) => !isPastDate(value), 'Date cannot be in the past');
      break;
    case FieldType.Color:
      schema = hexColorSchema;
      break;
    case FieldType.Select:
      schema = z.enum([field.options[0], ...field.options.slice(1)]);
      break;
    default:
      throw new Error(`Unsupported field type: ${String(field)}`);
  }

  return field.required ? schema : schema.optional();
}

export function createSubmissionAnswersSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodType<FormAnswerValue | undefined>> = Object.fromEntries(
    fields.map((field) => [submissionAnswerKey(field), answerSchemaForField(field)]),
  );

  return z.object(shape);
}

