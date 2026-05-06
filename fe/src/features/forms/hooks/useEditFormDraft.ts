'use client';

import { useCallback, useMemo, useState } from 'react';
import { FieldType, type FormDto, type FormField, type UpdateFormInput } from '@topcv/shared';

import { addFormField, moveFormField, removeFormField } from '../model/formFieldMutations';
import { reorderFields } from '../model/reorderFields';

function createLocalFieldId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureFormFieldIds(fields: FormField[]): FormField[] {
  let changed = false;
  const next = fields.map((field) => {
    if (field.id) return field;
    changed = true;
    return { ...field, id: `local-${createLocalFieldId()}` };
  });
  return changed ? next : fields;
}

function snapshotEditFields(form: FormDto): FormField[] {
  return ensureFormFieldIds([...form.fields].sort((a, b) => a.order - b.order));
}

export interface EditFormDraftController {
  isEditing: boolean;
  toggle(): void;
  cancel(): void;

  editTitle: string;
  setEditTitle(value: string): void;
  editDescription: string;
  setEditDescription(value: string): void;
  editOrder: string;
  setEditOrder(value: string): void;
  editStatus: FormDto['status'];
  setEditStatus(value: FormDto['status']): void;

  editFields: FormField[];
  updateField(index: number, patch: Partial<FormField>): void;
  changeFieldType(index: number, nextType: FieldType): void;
  setSelectOptions(index: number, options: string[]): void;
  removeField(index: number): void;
  moveField(index: number, delta: -1 | 1): void;
  reorderFieldsById(activeId: string, overId: string): void;

  newFieldLabel: string;
  setNewFieldLabel(value: string): void;
  newFieldType: FieldType;
  setNewFieldType(value: FieldType): void;
  newFieldRequired: boolean;
  setNewFieldRequired(value: boolean): void;
  newFieldOptions: string;
  setNewFieldOptions(value: string): void;
  commitNewField(): void;

  canSave: boolean;
  buildUpdate(formId: string, fallbackOrder: number): UpdateFormInput;
}

export function useEditFormDraft(form: FormDto): EditFormDraftController {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(form.title);
  const [editDescription, setEditDescription] = useState(form.description ?? '');
  const [editOrder, setEditOrder] = useState(String(form.order));
  const [editStatus, setEditStatus] = useState<FormDto['status']>(form.status);
  const [editFields, setEditFields] = useState<FormField[]>(() => snapshotEditFields(form));

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>(FieldType.Text);
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const cancel = useCallback(() => {
    setIsEditing(false);
    setEditTitle(form.title);
    setEditDescription(form.description ?? '');
    setEditOrder(String(form.order));
    setEditStatus(form.status);
    setEditFields(snapshotEditFields(form));
    setNewFieldLabel('');
    setNewFieldType(FieldType.Text);
    setNewFieldRequired(true);
    setNewFieldOptions('');
  }, [form]);

  const toggle = useCallback(() => setIsEditing((v) => !v), []);

  const updateField = useCallback((index: number, patch: Partial<FormField>) => {
    setEditFields((current) =>
      current.map((field, i) => (i === index ? ({ ...field, ...patch } as FormField) : field)),
    );
  }, []);

  const changeFieldType = useCallback((index: number, nextType: FieldType) => {
    setEditFields((current) =>
      current.map((field, i) => {
        if (i !== index) return field;
        if (nextType === FieldType.Select) {
          return {
            ...field,
            type: nextType,
            options: field.options?.length ? field.options : ['Option 1'],
          } as FormField;
        }
        return { ...field, type: nextType, options: undefined } as FormField;
      }),
    );
  }, []);

  const setSelectOptions = useCallback((index: number, options: string[]) => {
    setEditFields((current) =>
      current.map((field, i) =>
        i === index && field.type === FieldType.Select ? ({ ...field, options } as FormField) : field,
      ),
    );
  }, []);

  const removeField = useCallback(
    (index: number) => setEditFields((current) => removeFormField(current, index)),
    [],
  );

  const moveField = useCallback(
    (index: number, delta: -1 | 1) => setEditFields((current) => moveFormField(current, index, delta)),
    [],
  );

  const reorderFieldsById = useCallback((activeId: string, overId: string) => {
    setEditFields((current) => {
      const fromIndex = current.findIndex((field) => field.id === activeId);
      const toIndex = current.findIndex((field) => field.id === overId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = reorderFields(current, fromIndex, toIndex);
      if (next === current) return current;
      return (next as FormField[]).map((field, order) => ({ ...field, order }));
    });
  }, []);

  const commitNewField = useCallback(() => {
    setEditFields((current) =>
      addFormField(current, {
        label: newFieldLabel,
        type: newFieldType,
        required: newFieldRequired,
        selectOptionsRaw: newFieldOptions,
      }),
    );
    setNewFieldLabel('');
    setNewFieldType(FieldType.Text);
    setNewFieldRequired(true);
    setNewFieldOptions('');
  }, [newFieldLabel, newFieldType, newFieldRequired, newFieldOptions]);

  const canSave = useMemo(
    () => editTitle.trim().length > 0 && editFields.length > 0,
    [editTitle, editFields.length],
  );

  const buildUpdate = useCallback(
    (formId: string, fallbackOrder: number): UpdateFormInput => {
      const orderNumber = Number(editOrder);
      return {
        id: formId,
        title: editTitle.trim(),
        description: editDescription,
        status: editStatus,
        order: Number.isFinite(orderNumber) ? orderNumber : fallbackOrder,
        fields: editFields.map((field, index) => ({ ...field, order: index })),
      };
    },
    [editOrder, editTitle, editDescription, editStatus, editFields],
  );

  return {
    isEditing,
    toggle,
    cancel,
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
  };
}
