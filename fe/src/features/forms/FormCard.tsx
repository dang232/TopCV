'use client';

import type { ChangeEvent } from 'react';
import { FieldType, submissionAnswerKey, type FormDto, type FormField } from '@topcv/shared';

interface FormCardProps {
  form: FormDto;
  answers: Record<string, string>;
  onAnswerChange(key: string, value: string): void;
  onDelete(id: string): void;
  onSubmit(form: FormDto): void;
  onToggleStatus(form: FormDto): void;
}

function todayIsoDate(): string {
  const date = new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange(value: string): void;
}) {
  const common = {
    className: 'mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2',
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(event.target.value),
  };

  switch (field.type) {
    case FieldType.Number:
      return <input {...common} inputMode="numeric" type="number" min={0} max={100} />;
    case FieldType.Date:
      return <input {...common} type="date" min={todayIsoDate()} />;
    case FieldType.Color:
      return <input {...common} type="color" />;
    case FieldType.Select:
      return (
        <select {...common}>
          <option value="">Select…</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case FieldType.Text:
    default:
      return <input {...common} type="text" maxLength={200} />;
  }
}

export function FormCard({ form, answers, onAnswerChange, onDelete, onSubmit, onToggleStatus }: FormCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{form.title}</h3>
          <p className="text-sm text-zinc-600">{form.status}</p>
          <p className="text-sm text-zinc-600">{form.fields.length} field(s)</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-zinc-300 px-3 py-1 text-sm" onClick={() => onToggleStatus(form)}>
            Toggle status
          </button>
          <button className="rounded-lg border border-zinc-300 px-3 py-1 text-sm" onClick={() => onDelete(form.id)}>
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {form.fields.map((field) => {
          const answerKey = submissionAnswerKey(field);

          return (
            <label key={answerKey} className="block text-sm font-medium">
              Answer for {field.label}
              <FieldInput field={field} value={answers[answerKey] ?? ''} onChange={(next) => onAnswerChange(answerKey, next)} />
            </label>
          );
        })}
        <button className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white" onClick={() => onSubmit(form)}>
          Submit response
        </button>
      </div>
    </article>
  );
}
