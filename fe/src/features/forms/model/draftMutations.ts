import { FieldType } from '@topcv/shared';

import { buildDraftField } from './draftField';
import type { CreateFormDraft } from './draftTypes';

export function addDraftField(draft: CreateFormDraft): CreateFormDraft {
  const nextField = buildDraftField({
    label: draft.fieldLabel,
    type: draft.fieldType,
    required: draft.required,
    selectOptionsRaw: draft.selectOptions,
  });

  return {
    ...draft,
    fields: [...draft.fields, nextField],
    fieldLabel: '',
    fieldType: FieldType.Text,
    selectOptions: '',
    required: true,
  };
}

export function removeDraftField(draft: CreateFormDraft, index: number): CreateFormDraft {
  return {
    ...draft,
    fields: draft.fields.filter((_, current) => current !== index),
  };
}

export function moveDraftField(draft: CreateFormDraft, index: number, direction: -1 | 1): CreateFormDraft {
  const target = index + direction;
  return reorderDraftField(draft, index, target);
}

export function reorderDraftField(draft: CreateFormDraft, fromIndex: number, toIndex: number): CreateFormDraft {
  if (fromIndex === toIndex) {
    return draft;
  }
  if (fromIndex < 0 || fromIndex >= draft.fields.length) {
    return draft;
  }
  if (toIndex < 0 || toIndex >= draft.fields.length) {
    return draft;
  }

  const next = [...draft.fields];
  const [item] = next.splice(fromIndex, 1);
  if (!item) {
    return draft;
  }
  next.splice(toIndex, 0, item);

  return { ...draft, fields: next };
}

