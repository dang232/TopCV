'use client';

import type { FormDto, SubmissionDto, UpdateFormInput } from '@topcv/shared';
import { useMemo, useState } from 'react';

import { FormCard } from './FormCard';
import { FormsToolbar } from './FormsToolbar';
import { formsButtonOutline } from './formsButtonStyles';

export type FormsMode = 'admin' | 'staff';

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function truncateId(value: string, keep = 8) {
  if (value.length <= keep * 2 + 1) return value;
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

function normalizeAnswerValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

interface FormsListPanelProps {
  mode: FormsMode;
  isAdminSearchMode?: boolean;
  answers: Record<string, string>;
  forms: FormDto[];
  isSubmitting?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPrevPage?(): void;
  onNextPage?(): void;
  submissions: SubmissionDto[];
  onAnswerChange(key: string, value: string): void;
  onDelete(id: string): void;
  onLoadActive(): void;
  onLoadSubmissions(): void;
  onRefresh(): void;
  onSearch(query: string): void;
  onSubmit(form: FormDto): void;
  onToggleStatus(form: FormDto): void;
  onUpdateForm(input: UpdateFormInput): void;
}

export function FormsListPanel({
  mode,
  isAdminSearchMode,
  answers,
  forms,
  isSubmitting,
  page,
  pageSize,
  total,
  onPrevPage,
  onNextPage,
  submissions,
  onAnswerChange,
  onDelete,
  onLoadActive,
  onLoadSubmissions,
  onRefresh,
  onSearch,
  onSubmit,
  onToggleStatus,
  onUpdateForm,
}: FormsListPanelProps) {
  const totalPages =
    mode === 'admin' && total !== undefined && pageSize !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const canPrev = mode === 'admin' && page !== undefined ? page > 1 : false;
  const canNext = mode === 'admin' && page !== undefined ? page < totalPages : false;
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const formTitleById = useMemo(() => Object.fromEntries(forms.map((form) => [form.id, form.title] as const)), [forms]);
  const fieldLabelByFormAndKey = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const form of forms) {
      map[form.id] = Object.fromEntries(form.fields.map((field) => [field.id, field.label] as const));
    }
    return map;
  }, [forms]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <FormsToolbar
        onSearch={onSearch}
        onRefresh={onRefresh}
        onLoadActive={onLoadActive}
        onLoadSubmissions={onLoadSubmissions}
      />

      {mode === 'admin' && !isAdminSearchMode && page !== undefined && pageSize !== undefined && total !== undefined ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            Page <span className="font-medium text-zinc-900">{page}</span> of{' '}
            <span className="font-medium text-zinc-900">{totalPages}</span> ·{' '}
            <span className="font-medium text-zinc-900">{total}</span> total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={`${formsButtonOutline} px-3 py-2`}
              onClick={onPrevPage}
              disabled={!canPrev}
            >
              Prev
            </button>
            <button
              type="button"
              className={`${formsButtonOutline} px-3 py-2`}
              onClick={onNextPage}
              disabled={!canNext}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {forms.length === 0 ? <p className="text-sm text-zinc-600">No forms yet.</p> : null}
        {forms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            mode={mode}
            answers={answers}
            isSubmitting={isSubmitting}
            onAnswerChange={onAnswerChange}
            onDelete={onDelete}
            onSubmit={onSubmit}
            onToggleStatus={onToggleStatus}
            onUpdateForm={onUpdateForm}
          />
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-zinc-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-sm font-semibold text-zinc-900">Submissions</h4>
          <p className="text-xs text-zinc-600">{submissions.length} total</p>
        </div>

        {submissions.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No submissions loaded yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {submissions.slice(0, 20).map((submission) => (
              <li key={submission.id} className="rounded-lg border border-zinc-200 bg-white p-3">
                <button
                  type="button"
                  className="w-full text-left"
                  aria-expanded={expandedSubmissionId === submission.id}
                  aria-controls={`submission-details-${submission.id}`}
                  aria-label={`Toggle submission details for ${formTitleById[submission.formId] ?? submission.formId}`}
                  onClick={() => setExpandedSubmissionId((current) => (current === submission.id ? null : submission.id))}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-zinc-900">
                      {formTitleById[submission.formId] ?? submission.formId}
                    </p>
                    <p className="text-xs text-zinc-600">{formatDateTime(submission.submittedAt)}</p>
                  </div>
                  <p className="mt-2 text-xs text-zinc-600">
                    {Object.keys(submission.answers ?? {}).length} answer(s) ·{' '}
                    <span className="font-mono">{truncateId(submission.id)}</span>
                  </p>
                </button>

                {expandedSubmissionId === submission.id ? (
                  <div
                    id={`submission-details-${submission.id}`}
                    className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <dl className="grid gap-2 text-xs text-zinc-700 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="font-medium text-zinc-900">Submitted</dt>
                        <dd className="mt-0.5">{formatDateTime(submission.submittedAt)}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="font-medium text-zinc-900">Form</dt>
                        <dd className="mt-0.5">
                          {formTitleById[submission.formId] ? (
                            <>
                              {formTitleById[submission.formId]} <span className="text-zinc-500">({submission.formId})</span>
                            </>
                          ) : (
                            submission.formId
                          )}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-medium text-zinc-900">Submission id</dt>
                        <dd className="mt-0.5 font-mono">{submission.id}</dd>
                      </div>
                    </dl>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-zinc-900">Answers</p>
                      {Object.keys(submission.answers ?? {}).length === 0 ? (
                        <p className="mt-1 text-xs text-zinc-600">No answers.</p>
                      ) : (
                        <div className="mt-2 overflow-hidden rounded-md border border-zinc-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50 text-[11px] text-zinc-600">
                              <tr>
                                <th scope="col" className="w-1/2 px-2 py-1.5 font-medium">
                                  Question
                                </th>
                                <th scope="col" className="w-1/2 px-2 py-1.5 font-medium">
                                  Answer
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {Object.entries(submission.answers ?? {})
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([key, rawValue]) => {
                                  const value = normalizeAnswerValue(rawValue);
                                  const label = fieldLabelByFormAndKey[submission.formId]?.[key];
                                  const displayKey = label ?? key;
                                  const showKeyHint = Boolean(label) && label !== key;
                                  const trimmed = value.trim();
                                  const hexColor = isHexColor(trimmed) ? trimmed.toLowerCase() : null;

                                  return (
                                    <tr key={key} className="align-top">
                                      <th scope="row" className="px-2 py-1.5 font-medium text-zinc-900">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="break-words">{displayKey}</span>
                                          {showKeyHint ? (
                                            <span className="font-mono text-[11px] font-normal text-zinc-500">{key}</span>
                                          ) : null}
                                        </div>
                                      </th>
                                      <td className="px-2 py-1.5 text-zinc-900">
                                        {hexColor ? (
                                          <span className="inline-flex items-center gap-2">
                                            <span
                                              role="img"
                                              aria-label={`Color swatch ${hexColor}`}
                                              className="h-4 w-4 rounded border border-zinc-300"
                                              style={{ backgroundColor: hexColor }}
                                            />
                                            <span className="font-mono">{hexColor}</span>
                                          </span>
                                        ) : (
                                          <span className="break-words">{value}</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

