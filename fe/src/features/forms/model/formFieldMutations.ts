import { FieldType, type FormField } from '@topcv/shared';

import { buildDraftField } from './draftField';

export function moveFormField(fields: FormField[], index: number, delta: number): FormField[] {
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= fields.length) {
    return fields;
  }

  const copy = [...fields];
  const [field] = copy.splice(index, 1);
  if (!field) {
    return fields;
  }
  copy.splice(nextIndex, 0, field);

  return copy.map((item, order) => ({ ...item, order }));
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

