import type { FormField } from './form-field';
import type { FormStatus } from './form-status';

export interface CreateFormCommand {
  title: string;
  description: string;
  order: number;
  status: FormStatus;
  fields: FormField[];
}

export interface UpdateFormCommand {
  title?: string;
  description?: string;
  order?: number;
  status?: FormStatus;
  fields?: FormField[];
}

export interface FormSnapshot {
  id: string;
  title: string;
  description: string;
  order: number;
  status: FormStatus;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}
