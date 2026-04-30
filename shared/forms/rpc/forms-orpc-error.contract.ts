import { z } from 'zod';

/**
 * Forms bounded context: oRPC `.errors()` contract only (wire shape + OpenAPI).
 * Domain rules live in the backend domain/application layers; this file is the adapter contract.
 */
export const FormsOrpcErrorCode = {
  FormNotFound: 'FORM_NOT_FOUND',
} as const;

export type FormsOrpcErrorCode = (typeof FormsOrpcErrorCode)[keyof typeof FormsOrpcErrorCode];

export const FormNotFoundOrpcPayloadSchema = z.object({
  resource: z.literal('form'),
  id: z.string(),
});

export type FormNotFoundOrpcPayload = z.infer<typeof FormNotFoundOrpcPayloadSchema>;

export const formsProcedureFormLookupErrors = {
  [FormsOrpcErrorCode.FormNotFound]: {
    status: 404,
    message: 'Form not found',
    data: FormNotFoundOrpcPayloadSchema,
  },
} as const;
