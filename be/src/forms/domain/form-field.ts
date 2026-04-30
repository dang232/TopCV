import { FieldType } from './field-type';

interface BaseFormField {
  id?: string;
  label: string;
  order: number;
  required: boolean;
}

export interface SelectFormField extends BaseFormField {
  type: FieldType.Select;
  options: string[];
}

export interface SimpleFormField extends BaseFormField {
  type: Exclude<FieldType, FieldType.Select>;
  options?: undefined;
}

export type FormField = SimpleFormField | SelectFormField;
