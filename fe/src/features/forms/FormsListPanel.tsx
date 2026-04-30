'use client';

import type { FormDto, SubmissionDto } from '@topcv/shared';

import { FormCard } from './FormCard';
import { FormsToolbar } from './FormsToolbar';

interface FormsListPanelProps {
  answers: Record<string, string>;
  forms: FormDto[];
  submissions: SubmissionDto[];
  onAnswerChange(key: string, value: string): void;
  onDelete(id: string): void;
  onLoadActive(): void;
  onLoadSubmissions(): void;
  onRefresh(): void;
  onSearch(query: string): void;
  onSubmit(form: FormDto): void;
  onToggleStatus(form: FormDto): void;
}

export function FormsListPanel({
  answers,
  forms,
  submissions,
  onAnswerChange,
  onDelete,
  onLoadActive,
  onLoadSubmissions,
  onRefresh,
  onSearch,
  onSubmit,
  onToggleStatus,
}: FormsListPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <FormsToolbar onSearch={onSearch} onRefresh={onRefresh} onLoadActive={onLoadActive} onLoadSubmissions={onLoadSubmissions} />

      <div className="mt-6 space-y-3">
        {forms.length === 0 ? <p className="text-sm text-zinc-600">No forms yet.</p> : null}
        {forms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            answers={answers}
            onAnswerChange={onAnswerChange}
            onDelete={onDelete}
            onSubmit={onSubmit}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>

      {submissions.length > 0 ? (
        <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">{submissions.length} submission(s) loaded.</div>
      ) : null}
    </section>
  );
}
