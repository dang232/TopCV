import { describe, expect, it } from 'vitest';
import { FieldType, FormStatus } from '@topcv/shared';

import type { CreateFormDraft } from './draftTypes';
import { reorderDraftField } from './draftMutations';

function makeDraft(): CreateFormDraft {
  return {
    title: 'T',
    description: '',
    status: FormStatus.Draft,
    fieldLabel: '',
    fieldType: FieldType.Text,
    selectOptions: '',
    required: true,
    fields: [
      { id: 'a', label: 'A', type: FieldType.Text, required: true },
      { id: 'b', label: 'B', type: FieldType.Text, required: true },
      { id: 'c', label: 'C', type: FieldType.Text, required: true },
    ],
  };
}

describe('draftMutations', () => {
  it('reorders fields by index', () => {
    const draft = makeDraft();
    const next = reorderDraftField(draft, 2, 0);
    expect(next.fields.map((f) => f.id)).toEqual(['c', 'a', 'b']);
  });

  it('is a no-op when indices are invalid', () => {
    const draft = makeDraft();
    expect(reorderDraftField(draft, -1, 0)).toBe(draft);
    expect(reorderDraftField(draft, 0, 99)).toBe(draft);
    expect(reorderDraftField(draft, 1, 1)).toBe(draft);
  });
});

