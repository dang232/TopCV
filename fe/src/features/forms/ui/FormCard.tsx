'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, type ChangeEvent } from 'react';
import type React from 'react';
import { FieldType, FormStatus, submissionAnswerKey, type FormDto, type FormField, type UpdateFormInput } from '@topcv/shared';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { useEditFormDraft } from '../hooks/useEditFormDraft';
import { fieldPlaceholder, todayIsoDate } from '../lib/formatters';
import { fieldTypes } from '../model/fieldTypes';
import { SortableFieldRow } from './SortableFieldRow';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';

interface FormCardProps {
  form: FormDto;
  mode: 'admin' | 'staff';
  answers: Record<string, string>;
  isSubmitting?: boolean;
  onAnswerChange(key: string, value: string): void;
  onDelete(id: string): void;
  onSubmit(form: FormDto): void;
  onToggleStatus(form: FormDto): void;
  onUpdateForm(input: UpdateFormInput): void;
}

function FieldInput({
  field,
  value,
  onChange,
  inputProps,
}: {
  field: FormField;
  value: string;
  onChange(value: string): void;
  inputProps?: Record<string, unknown>;
}) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useLayoutEffect(() => {
    if (field.type === FieldType.Color && field.required && !value) {
      onChangeRef.current('#000000');
    }
  }, [field.required, field.type, value]);

  useLayoutEffect(() => {
    if (field.type === FieldType.Date && field.required && !value) {
      onChangeRef.current(todayIsoDate());
    }
  }, [field.required, field.type, value]);

  const common = {
    className:
      'mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background ' +
      'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange(event.target.value),
    required: field.required,
    ...inputProps,
  };

  switch (field.type) {
    case FieldType.Number:
      return <input {...common} inputMode="numeric" type="number" min={0} max={100} placeholder={fieldPlaceholder(field)} />;
    case FieldType.Date:
      return <input {...common} type="date" min={todayIsoDate()} placeholder={fieldPlaceholder(field)} />;
    case FieldType.Color:
      return (
        <div className="mt-1 flex items-center gap-2">
          <input
            className="h-10 w-14 rounded-md border border-input bg-background p-1"
            type="color"
            value={value || '#000000'}
            onChange={(event) => onChange(event.target.value)}
            required={field.required}
            aria-label={fieldPlaceholder(field)}
          />
          {!field.required && value ? (
            <Button variant="outline" size="sm" type="button" onClick={() => onChange('')}>
              Clear
            </Button>
          ) : null}
        </div>
      );
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
      return <input {...common} type="text" maxLength={200} placeholder={fieldPlaceholder(field)} />;
  }
}

function numberFieldError(value: string, required: boolean): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? 'This field is required.' : null;

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return 'Please enter a valid number.';
  if (numeric < 0 || numeric > 100) return 'Value must be between 0 and 100.';
  return null;
}

export function FormCard({
  form,
  mode,
  answers,
  isSubmitting,
  onAnswerChange,
  onDelete,
  onSubmit,
  onToggleStatus,
  onUpdateForm,
}: FormCardProps) {
  const stopRowDragStart = (event: React.PointerEvent<HTMLElement>) => event.stopPropagation();
  const {
    isEditing,
    toggle: toggleEditing,
    cancel: resetEditState,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editOrder,
    setEditOrder,
    editStatus,
    setEditStatus,
    editFields,
    updateField,
    changeFieldType,
    setSelectOptions,
    removeField,
    moveField,
    reorderFieldsById,
    newFieldLabel,
    setNewFieldLabel,
    newFieldType,
    setNewFieldType,
    newFieldRequired,
    setNewFieldRequired,
    newFieldOptions,
    setNewFieldOptions,
    commitNewField,
    canSave,
    buildUpdate,
  } = useEditFormDraft(form);
  const answerErrors = useMemo(() => {
    if (mode !== 'staff') return {};
    const entries = form.fields
      .filter((field) => field.type === FieldType.Number)
      .map((field) => {
        const key = submissionAnswerKey(field);
        return [key, numberFieldError(answers[key] ?? '', field.required)] as const;
      })
      .filter(([, error]) => Boolean(error));

    return Object.fromEntries(entries) as Record<string, string>;
  }, [answers, form.fields, mode]);
  const hasAnswerErrors = mode === 'staff' && Object.keys(answerErrors).length > 0;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function submitUpdate(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) return;

    onUpdateForm(buildUpdate(form.id, form.order));
    toggleEditing();
  }

  function handleEditFieldsDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId || activeId === overId) return;
    reorderFieldsById(activeId, overId);
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{form.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={form.status === FormStatus.Active ? 'default' : 'secondary'}>{form.status}</Badge>
            <span className="text-sm text-muted-foreground">{form.fields.length} field(s)</span>
          </div>
        </div>
        {mode === 'admin' ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" type="button" onClick={toggleEditing}>
              {isEditing ? 'Close' : 'Edit'}
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={() => onToggleStatus(form)}>
              Toggle status
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={() => onDelete(form.id)}>
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      {mode === 'admin' && isEditing ? (
        <form className="mt-4 space-y-4 rounded-xl border border-border bg-muted/40 p-4" onSubmit={submitUpdate}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium sm:col-span-2">
              Edit title
              <Input
                className="mt-1"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Edit description
              <textarea
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Edit order
              <Input
                className="mt-1"
                inputMode="numeric"
                type="number"
                min={0}
                value={editOrder}
                onChange={(e) => setEditOrder(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Edit status
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as FormDto['status'])}
              >
                <option value={FormStatus.Draft}>draft</option>
                <option value={FormStatus.Active}>active</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold">Fields</h4>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEditFieldsDragEnd}>
              <SortableContext items={editFields.map((f) => f.id as string)} strategy={verticalListSortingStrategy}>
                <ol className="mt-3 space-y-2">
                  {editFields.map((field, index) => (
                    <SortableFieldRow key={field.id as string} fieldId={field.id as string}>
                      {({ dragHandleProps, dragAttributes }) => (
                        <div
                          className="cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm active:cursor-grabbing"
                          {...dragAttributes}
                          {...dragHandleProps}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                            <span className="text-xs text-muted-foreground">(drag row to reorder)</span>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="block text-sm font-medium sm:col-span-2">
                              Label
                              <input
                                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={field.label}
                                onPointerDownCapture={stopRowDragStart}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                              />
                            </label>
                            <label className="block text-sm font-medium">
                              Type
                              <select
                                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={field.type}
                                onPointerDownCapture={stopRowDragStart}
                                onChange={(e) => changeFieldType(index, e.target.value as FieldType)}
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
                                checked={field.required}
                                onPointerDownCapture={stopRowDragStart}
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                              />
                              Required
                            </label>
                          </div>

                          {field.type === FieldType.Select ? (
                            <label className="mt-3 block text-sm font-medium">
                              Options
                              <input
                                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={(field.options ?? []).join(', ')}
                                onPointerDownCapture={stopRowDragStart}
                                onChange={(e) =>
                                  setSelectOptions(
                                    index,
                                    e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  )
                                }
                              />
                            </label>
                          ) : null}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => moveField(index, -1)}
                              disabled={index === 0}
                              onPointerDownCapture={stopRowDragStart}
                            >
                              Up
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => moveField(index, 1)}
                              disabled={index === editFields.length - 1}
                              onPointerDownCapture={stopRowDragStart}
                            >
                              Down
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => removeField(index)}
                              onPointerDownCapture={stopRowDragStart}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </SortableFieldRow>
                  ))}
                </ol>
              </SortableContext>
            </DndContext>

            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium sm:col-span-2">
                  New field label
                  <Input
                    className="mt-1"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                  />
                </label>
                <label className="block text-sm font-medium">
                  New field type
                  <select
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                  >
                    {fieldTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} />
                  Required
                </label>
              </div>

              {newFieldType === FieldType.Select ? (
                <label className="mt-3 block text-sm font-medium">
                  New select options
                  <Input
                    className="mt-1"
                    placeholder="Engineering, Sales"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                  />
                </label>
              ) : null}

              <Button
                className="mt-3"
                variant="outline"
                type="button"
                onClick={commitNewField}
                disabled={!newFieldLabel.trim()}
              >
                Add field
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canSave}>
              Save changes
            </Button>
            <Button variant="outline" type="button" onClick={resetEditState}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-3">
          {form.fields.map((field) => {
            const answerKey = submissionAnswerKey(field);
            const error = mode === 'staff' ? answerErrors[answerKey] : undefined;
            const errorId = error ? `${answerKey}-error` : undefined;
            const aria =
              mode === 'staff' && field.type === FieldType.Number
                ? {
                    'aria-invalid': Boolean(error),
                    'aria-describedby': errorId,
                  }
                : undefined;

            return (
              <label key={answerKey} className="block text-sm font-medium">
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
                <FieldInput
                  field={field}
                  value={answers[answerKey] ?? ''}
                  onChange={(next) => onAnswerChange(answerKey, next)}
                  inputProps={aria}
                />
                {error ? (
                  <span id={errorId} className="mt-1 block text-xs font-normal text-destructive">
                    {error}
                  </span>
                ) : null}
              </label>
            );
          })}
          <Button type="button" onClick={() => onSubmit(form)} disabled={isSubmitting || hasAnswerErrors}>
            Submit response
          </Button>
        </div>
      )}
    </article>
  );
}

