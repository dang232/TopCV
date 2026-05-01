import { FieldType } from '@topcv/shared';

import type { CreateFormDraft, DraftField } from './draftTypes';

function createDraftFieldId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function parseSelectOptions(raw: string): string[] {
  return raw
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}

export function buildDraftField(input: {
  label: string;
  type: FieldType;
  required: boolean;
  selectOptionsRaw?: string;
}): DraftField {
  const label = input.label.trim();
  const id = createDraftFieldId();

  if (input.type !== FieldType.Select) {
    return { id, label, type: input.type, required: input.required };
  }

  return {
    id,
    label,
    type: input.type,
    required: input.required,
    options: parseSelectOptions(input.selectOptionsRaw ?? ''),
  };
}

export function buildDraftFieldFromDraft(draft: CreateFormDraft): DraftField {
  return buildDraftField({
    label: draft.fieldLabel,
    type: draft.fieldType,
    required: draft.required,
    selectOptionsRaw: draft.selectOptions,
  });
}

