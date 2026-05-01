import { FieldType, FormStatus } from '@topcv/shared';

export interface DraftField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface CreateFormDraft {
  title: string;
  description: string;
  status: FormStatus;
  fieldLabel: string;
  fieldType: FieldType;
  selectOptions: string;
  required: boolean;
  fields: DraftField[];
}

