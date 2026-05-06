import { FieldType, type FormField } from '@topcv/shared';

import { buildDraftField } from './draftField';
import { reorderFields } from './reorderFields';

export function moveFormField(fields: FormField[], index: number, delta: number): FormField[] {
  const next = reorderFields(fields, index, index + delta);
  if (next === fields) return fields;
  return (next as FormField[]).map((item, order) => ({ ...item, order }));
}

export function removeFormField(fields: FormField[], index: number): FormField[] {
  return fields.filter((_, i) => i !== index).map((item, order) => ({ ...item, order }));
}

export function addFormField(
  fields: FormField[],
  input: { label: string; type: FieldType; required: boolean; selectOptionsRaw?: string },
): FormField[] {
  const draft = buildDraftField(input);

  const next: FormField =
    draft.type === FieldType.Select
      ? {
          id: draft.id,
          label: draft.label,
          type: draft.type,
          required: draft.required,
          options: (draft.options?.length ? draft.options : ['Option 1']) as string[],
          order: fields.length,
        }
      : { id: draft.id, label: draft.label, type: draft.type, required: draft.required, order: fields.length };

  return [...fields, next];
}

