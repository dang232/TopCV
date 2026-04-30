'use client';

import type { FormEvent } from 'react';
import { FieldType, FormStatus } from '@topcv/shared';

import { addDraftField, fieldTypes, moveDraftField, removeDraftField, type CreateFormDraft } from './formTypes';

interface CreateFormPanelProps {
  draft: CreateFormDraft;
  error: string;
  message: string;
  onDraftChange(draft: CreateFormDraft): void;
  onSubmit(event: FormEvent<HTMLFormElement>): void;
}

export function CreateFormPanel({ draft, error, message, onDraftChange, onSubmit }: CreateFormPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Dynamic Forms</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Create forms (admin) and let staff fill active forms in order.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium">
          Title
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
          />
        </label>

        <label className="block text-sm font-medium">
          Description
          <textarea
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={draft.description}
            onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
          />
        </label>

        <label className="block text-sm font-medium">
          Status
          <select
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={draft.status}
            onChange={(event) => onDraftChange({ ...draft, status: event.target.value as CreateFormDraft['status'] })}
          >
            <option value={FormStatus.Draft}>draft</option>
            <option value={FormStatus.Active}>active</option>
          </select>
        </label>

        <div className="rounded-xl border border-zinc-200 p-4">
          <h3 className="text-sm font-semibold">Fields</h3>
          {draft.fields.length > 0 ? (
            <ol className="mt-3 space-y-2">
              {draft.fields.map((field, index) => (
                <li key={`${field.label}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {index + 1}. {field.label}
                    </div>
                    <div className="text-zinc-600">
                      {field.type}
                      {field.required ? ' · required' : ' · optional'}
                      {field.type === FieldType.Select ? ` · ${(field.options ?? []).length} option(s)` : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                      type="button"
                      onClick={() => onDraftChange(moveDraftField(draft, index, -1))}
                      disabled={index === 0}
                    >
                      Up
                    </button>
                    <button
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                      type="button"
                      onClick={() => onDraftChange(moveDraftField(draft, index, 1))}
                      disabled={index === draft.fields.length - 1}
                    >
                      Down
                    </button>
                    <button
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                      type="button"
                      onClick={() => onDraftChange(removeDraftField(draft, index))}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">No fields added yet. Add at least one field below.</p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium sm:col-span-2">
              Field label
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                value={draft.fieldLabel}
                onChange={(event) => onDraftChange({ ...draft, fieldLabel: event.target.value })}
              />
            </label>

            <label className="block text-sm font-medium">
              Field type
              <select
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                value={draft.fieldType}
                onChange={(event) =>
                  onDraftChange({ ...draft, fieldType: event.target.value as CreateFormDraft['fieldType'] })
                }
              >
                {fieldTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={draft.required}
                onChange={(event) => onDraftChange({ ...draft, required: event.target.checked })}
              />
              Required
            </label>
          </div>

          {draft.fieldType === FieldType.Select ? (
            <label className="mt-3 block text-sm font-medium">
              Select options
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Engineering, Sales"
                value={draft.selectOptions}
                onChange={(event) => onDraftChange({ ...draft, selectOptions: event.target.value })}
              />
            </label>
          ) : null}

          <button
            className="mt-3 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            type="button"
            onClick={() => onDraftChange(addDraftField(draft))}
            disabled={!draft.fieldLabel.trim()}
          >
            Add field
          </button>
        </div>

        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

        <button className="w-full rounded-lg bg-zinc-950 px-4 py-2 font-medium text-white" type="submit">
          Create form
        </button>
      </form>
    </section>
  );
}
