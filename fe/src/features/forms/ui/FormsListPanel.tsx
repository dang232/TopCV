'use client';

import type { FormDto, SubmissionDto, UpdateFormInput } from '@topcv/shared';
import { useMemo, useState } from 'react';

import { formatDateTime, isHexColor, normalizeAnswerValue, truncateId } from '../lib/formatters';
import { FormCard } from './FormCard';
import { FormsToolbar } from './FormsToolbar';
import { Button } from '@/src/components/ui/button';

export type FormsMode = 'admin' | 'staff';

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
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <FormsToolbar
        onSearch={onSearch}
        onRefresh={onRefresh}
        onLoadActive={onLoadActive}
        onLoadSubmissions={onLoadSubmissions}
      />

      {mode === 'admin' && !isAdminSearchMode && page !== undefined && pageSize !== undefined && total !== undefined ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{' '}
            <span className="font-medium text-foreground">{totalPages}</span> ·{' '}
            <span className="font-medium text-foreground">{total}</span> total
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onPrevPage} disabled={!canPrev}>
              Prev
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onNextPage} disabled={!canNext}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {forms.length === 0 ? <p className="text-sm text-muted-foreground">No forms yet.</p> : null}
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

      <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-sm font-semibold">Submissions</h4>
          <p className="text-xs text-muted-foreground">{submissions.length} total</p>
        </div>

        {submissions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No submissions loaded yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {submissions.slice(0, 20).map((submission) => (
              <li key={submission.id} className="rounded-lg border border-border bg-card p-3">
                <button
                  type="button"
                  className="w-full text-left"
                  aria-expanded={expandedSubmissionId === submission.id}
                  aria-controls={`submission-details-${submission.id}`}
                  aria-label={`Toggle submission details for ${formTitleById[submission.formId] ?? submission.formId}`}
                  onClick={() => setExpandedSubmissionId((current) => (current === submission.id ? null : submission.id))}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">
                      {formTitleById[submission.formId] ?? submission.formId}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(submission.submittedAt)}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {Object.keys(submission.answers ?? {}).length} answer(s) ·{' '}
                    <span className="font-mono">{truncateId(submission.id)}</span>
                  </p>
                </button>

                {expandedSubmissionId === submission.id ? (
                  <div
                    id={`submission-details-${submission.id}`}
                    className="mt-3 rounded-lg border border-border bg-muted/40 p-3"
                  >
                    <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="font-medium text-foreground">Submitted</dt>
                        <dd className="mt-0.5">{formatDateTime(submission.submittedAt)}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="font-medium text-foreground">Form</dt>
                        <dd className="mt-0.5">
                          {formTitleById[submission.formId] ? (
                            <>
                              {formTitleById[submission.formId]} <span className="text-muted-foreground">({submission.formId})</span>
                            </>
                          ) : (
                            submission.formId
                          )}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-medium text-foreground">Submission id</dt>
                        <dd className="mt-0.5 font-mono">{submission.id}</dd>
                      </div>
                    </dl>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-foreground">Answers</p>
                      {Object.keys(submission.answers ?? {}).length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">No answers.</p>
                      ) : (
                        <div className="mt-2 overflow-hidden rounded-md border border-border bg-card">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                              <tr>
                                <th scope="col" className="w-1/2 px-2 py-1.5 font-medium">
                                  Question
                                </th>
                                <th scope="col" className="w-1/2 px-2 py-1.5 font-medium">
                                  Answer
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
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
                                      <th scope="row" className="px-2 py-1.5 font-medium text-foreground">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="break-words">{displayKey}</span>
                                          {showKeyHint ? (
                                            <span className="font-mono text-[11px] font-normal text-muted-foreground">{key}</span>
                                          ) : null}
                                        </div>
                                      </th>
                                      <td className="px-2 py-1.5 text-foreground">
                                        {hexColor ? (
                                          <span className="inline-flex items-center gap-2">
                                            <span
                                              role="img"
                                              aria-label={`Color swatch ${hexColor}`}
                                              className="h-4 w-4 rounded border border-border"
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

