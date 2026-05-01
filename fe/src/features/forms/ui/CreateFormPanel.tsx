'use client';

import type React from 'react';
import { FieldType, FormStatus } from '@topcv/shared';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { CreateFormDraft } from '../model/draftTypes';
import { fieldTypes } from '../model/fieldTypes';
import { addDraftField, moveDraftField, removeDraftField, reorderDraftField } from '../model/draftMutations';
import { formsButtonOutline, formsButtonPrimary, formsButtonXs } from './formsButtonStyles';

interface CreateFormPanelProps {
  draft: CreateFormDraft;
  error: string;
  message: string;
  onDraftChange(draft: CreateFormDraft): void;
  onSubmit(event: React.SyntheticEvent<HTMLFormElement>): void;
}

function SortableDraftFieldRow({
  fieldId,
  children,
}: {
  fieldId: string;
  children: (params: {
    isDragging: boolean;
    dragHandleProps: React.HTMLAttributes<HTMLElement>;
    dragAttributes: Record<string, unknown>;
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: fieldId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={isDragging ? 'opacity-70' : undefined}>
      {children({
        isDragging,
        dragHandleProps: { ...listeners },
        dragAttributes: { ...attributes },
      })}
    </li>
  );
}

export function CreateFormPanel({ draft, error, message, onDraftChange, onSubmit }: CreateFormPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;

    const fromIndex = draft.fields.findIndex((f) => f.id === activeId);
    const toIndex = draft.fields.findIndex((f) => f.id === overId);
    if (fromIndex < 0 || toIndex < 0) return;

    onDraftChange(reorderDraftField(draft, fromIndex, toIndex));
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Dynamic Forms</h1>
      <p className="mt-2 text-sm text-zinc-600">Create forms (admin) and let staff fill active forms in order.</p>

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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={draft.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <ol className="mt-3 space-y-2">
                  {draft.fields.map((field, index) => (
                    <SortableDraftFieldRow key={field.id} fieldId={field.id}>
                      {({ dragHandleProps, dragAttributes }) => (
                        <div
                          className="flex cursor-grab items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm active:cursor-grabbing"
                          {...dragAttributes}
                          {...dragHandleProps}
                        >
                          <div className="flex min-w-0 items-start gap-2">
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
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              className={`${formsButtonOutline} ${formsButtonXs}`}
                              type="button"
                              onClick={() => onDraftChange(moveDraftField(draft, index, -1))}
                              disabled={index === 0}
                              onPointerDownCapture={(e) => e.stopPropagation()}
                            >
                              Up
                            </button>
                            <button
                              className={`${formsButtonOutline} ${formsButtonXs}`}
                              type="button"
                              onClick={() => onDraftChange(moveDraftField(draft, index, 1))}
                              disabled={index === draft.fields.length - 1}
                              onPointerDownCapture={(e) => e.stopPropagation()}
                            >
                              Down
                            </button>
                            <button
                              className={`${formsButtonOutline} ${formsButtonXs}`}
                              type="button"
                              onClick={() => onDraftChange(removeDraftField(draft, index))}
                              onPointerDownCapture={(e) => e.stopPropagation()}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </SortableDraftFieldRow>
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
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
            className={`mt-3 ${formsButtonOutline} px-3 py-2`}
            type="button"
            onClick={() => onDraftChange(addDraftField(draft))}
            disabled={!draft.fieldLabel.trim()}
          >
            Add field
          </button>
        </div>

        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

        <button className={`w-full ${formsButtonPrimary} px-4 py-2`} type="submit">
          Create form
        </button>
      </form>
    </section>
  );
}

