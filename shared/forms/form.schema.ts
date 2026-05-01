import { z } from 'zod';

import { FieldType, FormStatus } from './form.enum';

export const FormStatusSchema = z.enum(FormStatus);
export const FieldTypeSchema = z.enum(FieldType);

const FieldBaseSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().trim().min(1).max(100),
  order: z.number().int().min(0),
  required: z.boolean(),
});

export const TextFieldSchema = FieldBaseSchema.extend({
  type: z.literal(FieldType.Text),
  options: z.undefined().optional(),
});

export const NumberFieldSchema = FieldBaseSchema.extend({
  type: z.literal(FieldType.Number),
  options: z.undefined().optional(),
});

export const DateFieldSchema = FieldBaseSchema.extend({
  type: z.literal(FieldType.Date),
  options: z.undefined().optional(),
});

export const ColorFieldSchema = FieldBaseSchema.extend({
  type: z.literal(FieldType.Color),
  options: z.undefined().optional(),
});

export const SelectFieldSchema = FieldBaseSchema.extend({
  type: z.literal(FieldType.Select),
  options: z.array(z.string().trim().min(1)).min(1),
});

export const FormFieldSchema = z.discriminatedUnion('type', [
  TextFieldSchema,
  NumberFieldSchema,
  DateFieldSchema,
  ColorFieldSchema,
  SelectFieldSchema,
]);

export const CreateFormInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).default(''),
  order: z.number().int().min(0),
  status: FormStatusSchema.default(FormStatus.Draft),
  fields: z.array(FormFieldSchema).min(1),
});

export const FormDtoSchema = CreateFormInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Pagination is 1-indexed: `page=1` returns the first page.
 * `pageSize` is the number of items per page.
 */
export const PaginationInputSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
});

export const PaginatedFormListSchema = z.object({
  items: z.array(FormDtoSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});

export const UpdateFormInputSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(500).optional(),
    order: z.number().int().min(0).optional(),
    status: FormStatusSchema.optional(),
    fields: z.array(FormFieldSchema).min(1).optional(),
  })
  .refine(
    ({ title, description, order, status, fields }) =>
      title !== undefined ||
      description !== undefined ||
      order !== undefined ||
      status !== undefined ||
      fields !== undefined,
    'At least one form property must be provided',
  );

export const FormIdInputSchema = z.object({
  id: z.string().min(1),
});

export const SearchFormsInputSchema = z.object({
  query: z.string().trim().min(1),
});

export const FormAnswerValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const SubmitFormInputSchema = z.object({
  formId: z.string().min(1),
  answers: z.record(z.string().min(1), FormAnswerValueSchema),
});

export const SubmissionDtoSchema = z.object({
  id: z.string().min(1),
  formId: z.string().min(1),
  answers: z.record(z.string().min(1), FormAnswerValueSchema),
  submittedAt: z.string().datetime(),
});

export type FormField = z.infer<typeof FormFieldSchema>;
export type CreateFormInput = z.infer<typeof CreateFormInputSchema>;
export type UpdateFormInput = z.infer<typeof UpdateFormInputSchema>;
export type FormDto = z.infer<typeof FormDtoSchema>;
export type PaginationInput = z.infer<typeof PaginationInputSchema>;
export type PaginatedFormList = z.infer<typeof PaginatedFormListSchema>;
export type SearchFormsInput = z.infer<typeof SearchFormsInputSchema>;
export type FormAnswerValue = z.infer<typeof FormAnswerValueSchema>;
export type SubmitFormInput = z.infer<typeof SubmitFormInputSchema>;
export type SubmissionDto = z.infer<typeof SubmissionDtoSchema>;

/** Stable answer key on the wire; matches CSR inputs (`field.id ?? field.label`). */
export function submissionAnswerKey(field: FormField): string {
  return field.id ?? field.label;
}
