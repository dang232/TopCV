import { FieldType } from '@topcv/shared';

import { buildDraftField } from './draftField';
import type { CreateFormDraft } from './draftTypes';
import { reorderFields } from './reorderFields';

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
  const next = reorderFields(draft.fields, fromIndex, toIndex);
  if (next === draft.fields) return draft;
  return { ...draft, fields: next as CreateFormDraft['fields'] };
}

