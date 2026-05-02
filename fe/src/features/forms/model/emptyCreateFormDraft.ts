import { FieldType, FormStatus } from '@topcv/shared';

import type { CreateFormDraft } from './draftTypes';

export function emptyCreateFormDraft(): CreateFormDraft {
  return {
    title: '',
    description: '',
    status: FormStatus.Draft,
    fieldLabel: '',
    fieldType: FieldType.Text,
    selectOptions: '',
    required: true,
    fields: [],
  };
}
